"""
Market Data Service - Casa de Valores Information System
Handles real-time market data, historical data, and technical indicators
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import redis
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os
from contextlib import asynccontextmanager
import numpy as np
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import websockets
import aiohttp

from models import MarketData, HistoricalData, TechnicalIndicator, MarketAlert
from schemas import (
    MarketDataResponse, HistoricalDataRequest, HistoricalDataResponse,
    TechnicalIndicatorRequest, TechnicalIndicatorResponse, MarketAlertRequest,
    MarketAlertResponse, SubscriptionRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/3")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/casa_valores_docs")
MARKET_DATA_API_KEY = os.getenv("MARKET_DATA_API_KEY", "demo-key")
MARKET_DATA_BASE_URL = os.getenv("MARKET_DATA_BASE_URL", "https://api.example.com/v1")

# Global variables
redis_client = None
mongodb_client = None
mongodb_db = None
active_connections: Dict[str, List[WebSocket]] = {}
market_data_cache: Dict[str, Dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, mongodb_client, mongodb_db
    
    # Startup
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    mongodb_db = mongodb_client.casa_valores_docs
    
    # Start background tasks
    asyncio.create_task(market_data_updater())
    asyncio.create_task(process_market_alerts())
    
    logger.info("Market Data Service started successfully")
    
    yield
    
    # Shutdown
    if redis_client:
        redis_client.close()
    if mongodb_client:
        mongodb_client.close()
    logger.info("Market Data Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Market Data Service",
    description="Real-time market data and analytics for Casa de Valores",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = []
        self.active_connections[symbol].append(websocket)
        logger.info(f"Client connected to {symbol} feed")
    
    def disconnect(self, websocket: WebSocket, symbol: str):
        if symbol in self.active_connections:
            self.active_connections[symbol].remove(websocket)
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]
        logger.info(f"Client disconnected from {symbol} feed")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_symbol(self, message: dict, symbol: str):
        if symbol in self.active_connections:
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove dead connections
                    self.active_connections[symbol].remove(connection)

manager = ConnectionManager()

# Utility functions
def calculate_sma(prices: List[float], period: int) -> List[float]:
    """Calculate Simple Moving Average"""
    if len(prices) < period:
        return []
    
    sma = []
    for i in range(period - 1, len(prices)):
        avg = sum(prices[i - period + 1:i + 1]) / period
        sma.append(avg)
    
    return sma

def calculate_ema(prices: List[float], period: int) -> List[float]:
    """Calculate Exponential Moving Average"""
    if len(prices) < period:
        return []
    
    multiplier = 2 / (period + 1)
    ema = [sum(prices[:period]) / period]  # Start with SMA
    
    for i in range(period, len(prices)):
        ema_value = (prices[i] * multiplier) + (ema[-1] * (1 - multiplier))
        ema.append(ema_value)
    
    return ema

def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
    """Calculate Relative Strength Index"""
    if len(prices) < period + 1:
        return []
    
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [delta if delta > 0 else 0 for delta in deltas]
    losses = [-delta if delta < 0 else 0 for delta in deltas]
    
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    rsi = []
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        if avg_loss == 0:
            rsi.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi_value = 100 - (100 / (1 + rs))
            rsi.append(rsi_value)
    
    return rsi

def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[float]]:
    """Calculate MACD (Moving Average Convergence Divergence)"""
    if len(prices) < slow:
        return {"macd": [], "signal": [], "histogram": []}
    
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    # Align the EMAs (slow EMA starts later)
    start_idx = slow - fast
    ema_fast = ema_fast[start_idx:]
    
    macd = [fast_val - slow_val for fast_val, slow_val in zip(ema_fast, ema_slow)]
    signal_line = calculate_ema(macd, signal)
    
    # Align MACD and signal line
    start_idx = signal - 1
    macd_aligned = macd[start_idx:]
    
    histogram = [macd_val - signal_val for macd_val, signal_val in zip(macd_aligned, signal_line)]
    
    return {
        "macd": macd_aligned,
        "signal": signal_line,
        "histogram": histogram
    }

async def fetch_external_market_data(symbol: str) -> Optional[Dict]:
    """Fetch market data from external API"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{MARKET_DATA_BASE_URL}/quote/{symbol}"
            headers = {"Authorization": f"Bearer {MARKET_DATA_API_KEY}"}
            
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "symbol": symbol,
                        "price": data.get("price", 0.0),
                        "volume": data.get("volume", 0),
                        "change": data.get("change", 0.0),
                        "change_percent": data.get("change_percent", 0.0),
                        "timestamp": datetime.utcnow().isoformat()
                    }
    except Exception as e:
        logger.error(f"Error fetching market data for {symbol}: {e}")
    
    return None

async def market_data_updater():
    """Background task to update market data"""
    symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]  # Example symbols
    
    while True:
        try:
            for symbol in symbols:
                # Simulate market data (replace with real API calls)
                import random
                price = random.uniform(100, 500)
                volume = random.randint(1000, 100000)
                change = random.uniform(-5, 5)
                change_percent = (change / price) * 100
                
                market_data = {
                    "symbol": symbol,
                    "price": round(price, 2),
                    "volume": volume,
                    "change": round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "timestamp": datetime.utcnow().isoformat(),
                    "bid": round(price - 0.01, 2),
                    "ask": round(price + 0.01, 2),
                    "high": round(price * 1.02, 2),
                    "low": round(price * 0.98, 2),
                    "open": round(price * 0.99, 2)
                }
                
                # Cache in Redis
                redis_client.setex(f"market_data:{symbol}", 60, json.dumps(market_data))
                
                # Store in MongoDB for historical data
                await mongodb_db.historical_data.insert_one({
                    **market_data,
                    "timestamp": datetime.utcnow()
                })
                
                # Broadcast to WebSocket clients
                await manager.broadcast_to_symbol(market_data, symbol)
                
                # Update global cache
                market_data_cache[symbol] = market_data
            
            await asyncio.sleep(1)  # Update every second
            
        except Exception as e:
            logger.error(f"Error in market data updater: {e}")
            await asyncio.sleep(5)

async def process_market_alerts():
    """Background task to process market alerts"""
    while True:
        try:
            # Get all active alerts from MongoDB
            alerts_cursor = mongodb_db.market_alerts.find({"is_active": True})
            alerts = await alerts_cursor.to_list(length=None)
            
            for alert in alerts:
                symbol = alert["symbol"]
                condition = alert["condition"]
                target_value = alert["target_value"]
                
                # Get current market data
                current_data = market_data_cache.get(symbol)
                if not current_data:
                    continue
                
                current_price = current_data["price"]
                triggered = False
                
                # Check alert conditions
                if condition == "above" and current_price > target_value:
                    triggered = True
                elif condition == "below" and current_price < target_value:
                    triggered = True
                elif condition == "equals" and abs(current_price - target_value) < 0.01:
                    triggered = True
                
                if triggered:
                    # Trigger alert
                    alert_message = {
                        "type": "alert",
                        "alert_id": str(alert["_id"]),
                        "symbol": symbol,
                        "message": f"{symbol} price {condition} {target_value}",
                        "current_price": current_price,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    # Broadcast alert
                    await manager.broadcast_to_symbol(alert_message, symbol)
                    
                    # Deactivate alert
                    await mongodb_db.market_alerts.update_one(
                        {"_id": alert["_id"]},
                        {"$set": {"is_active": False, "triggered_at": datetime.utcnow()}}
                    )
            
            await asyncio.sleep(1)  # Check every second
            
        except Exception as e:
            logger.error(f"Error in alert processor: {e}")
            await asyncio.sleep(5)

# WebSocket endpoint for real-time data
@app.websocket("/ws/market-data/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket, symbol)
    try:
        # Send current data immediately
        current_data = redis_client.get(f"market_data:{symbol}")
        if current_data:
            await websocket.send_text(current_data)
        
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)

# REST API endpoints
@app.get("/api/v1/market-data/{symbol}", response_model=MarketDataResponse)
async def get_market_data(symbol: str):
    """Get current market data for a symbol"""
    # Try Redis cache first
    cached_data = redis_client.get(f"market_data:{symbol}")
    if cached_data:
        return json.loads(cached_data)
    
    # Fallback to external API
    data = await fetch_external_market_data(symbol)
    if data:
        return data
    
    raise HTTPException(status_code=404, detail="Market data not found")

@app.get("/api/v1/market-data", response_model=List[MarketDataResponse])
async def get_multiple_market_data(symbols: str):
    """Get market data for multiple symbols"""
    symbol_list = symbols.split(",")
    results = []
    
    for symbol in symbol_list:
        cached_data = redis_client.get(f"market_data:{symbol}")
        if cached_data:
            results.append(json.loads(cached_data))
    
    return results

@app.post("/api/v1/historical-data", response_model=List[HistoricalDataResponse])
async def get_historical_data(request: HistoricalDataRequest):
    """Get historical market data"""
    try:
        # Query MongoDB for historical data
        query = {
            "symbol": request.symbol,
            "timestamp": {
                "$gte": request.start_date,
                "$lte": request.end_date
            }
        }
        
        cursor = mongodb_db.historical_data.find(query).sort("timestamp", 1)
        data = await cursor.to_list(length=request.limit or 1000)
        
        return [
            {
                "symbol": item["symbol"],
                "timestamp": item["timestamp"],
                "open": item.get("open", item["price"]),
                "high": item.get("high", item["price"]),
                "low": item.get("low", item["price"]),
                "close": item["price"],
                "volume": item["volume"]
            }
            for item in data
        ]
    
    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching historical data")

@app.post("/api/v1/technical-indicators", response_model=TechnicalIndicatorResponse)
async def calculate_technical_indicators(request: TechnicalIndicatorRequest):
    """Calculate technical indicators"""
    try:
        # Get historical prices
        query = {
            "symbol": request.symbol,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=100)}
        }
        
        cursor = mongodb_db.historical_data.find(query).sort("timestamp", 1)
        data = await cursor.to_list(length=None)
        
        if not data:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        prices = [item["price"] for item in data]
        timestamps = [item["timestamp"] for item in data]
        
        indicators = {}
        
        for indicator in request.indicators:
            if indicator == "sma":
                indicators["sma"] = calculate_sma(prices, request.period or 20)
            elif indicator == "ema":
                indicators["ema"] = calculate_ema(prices, request.period or 20)
            elif indicator == "rsi":
                indicators["rsi"] = calculate_rsi(prices, request.period or 14)
            elif indicator == "macd":
                indicators["macd"] = calculate_macd(prices)
        
        return {
            "symbol": request.symbol,
            "indicators": indicators,
            "timestamps": [ts.isoformat() for ts in timestamps[-len(list(indicators.values())[0]):]] if indicators else []
        }
    
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        raise HTTPException(status_code=500, detail="Error calculating indicators")

@app.post("/api/v1/market-alerts", response_model=MarketAlertResponse)
async def create_market_alert(request: MarketAlertRequest):
    """Create a market alert"""
    try:
        alert_doc = {
            "user_id": request.user_id,
            "symbol": request.symbol,
            "condition": request.condition,
            "target_value": request.target_value,
            "message": request.message,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        result = await mongodb_db.market_alerts.insert_one(alert_doc)
        
        return {
            "id": str(result.inserted_id),
            "user_id": request.user_id,
            "symbol": request.symbol,
            "condition": request.condition,
            "target_value": request.target_value,
            "message": request.message,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail="Error creating alert")

@app.get("/api/v1/market-alerts/{user_id}", response_model=List[MarketAlertResponse])
async def get_user_alerts(user_id: str):
    """Get user's market alerts"""
    try:
        cursor = mongodb_db.market_alerts.find({"user_id": user_id})
        alerts = await cursor.to_list(length=None)
        
        return [
            {
                "id": str(alert["_id"]),
                "user_id": alert["user_id"],
                "symbol": alert["symbol"],
                "condition": alert["condition"],
                "target_value": alert["target_value"],
                "message": alert["message"],
                "is_active": alert["is_active"],
                "created_at": alert["created_at"]
            }
            for alert in alerts
        ]
    
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Error fetching alerts")

@app.delete("/api/v1/market-alerts/{alert_id}")
async def delete_market_alert(alert_id: str):
    """Delete a market alert"""
    try:
        from bson import ObjectId
        result = await mongodb_db.market_alerts.delete_one({"_id": ObjectId(alert_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"message": "Alert deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting alert: {e}")
        raise HTTPException(status_code=500, detail="Error deleting alert")

# Public endpoints (no authentication required)
@app.get("/api/v1/public/market-overview")
async def get_market_overview():
    """Get market overview (public endpoint)"""
    try:
        # Get data for major indices/symbols
        major_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
        overview = []
        
        for symbol in major_symbols:
            cached_data = redis_client.get(f"market_data:{symbol}")
            if cached_data:
                overview.append(json.loads(cached_data))
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "market_status": "open",  # Would determine actual market status
            "major_stocks": overview
        }
    
    except Exception as e:
        logger.error(f"Error fetching market overview: {e}")
        raise HTTPException(status_code=500, detail="Error fetching market overview")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "market-data",
        "redis_connected": redis_client.ping() if redis_client else False,
        "mongodb_connected": True  # Would check MongoDB connection
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )