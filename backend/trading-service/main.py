"""
Trading Service - Casa de Valores Information System
Handles order management, trade execution, and trading operations
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import redis
import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
import os
from contextlib import asynccontextmanager
from decimal import Decimal
import uuid
from celery import Celery
import httpx

from models import Order, Trade, OrderStatus, OrderType, OrderSide, Position
from database import get_db, engine, Base
from schemas import (
    OrderCreateRequest, OrderResponse, OrderUpdateRequest, TradeResponse,
    PositionResponse, OrderBookResponse, TradingStatsResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql://app_user:app_password@localhost:3306/casa_valores")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/2")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:adminpassword@localhost:5672/")
MARKET_DATA_SERVICE_URL = os.getenv("MARKET_DATA_SERVICE_URL", "http://market-data-service:8000")

# Global variables
redis_client = None
celery_app = None
http_client = None

# Celery configuration
celery_app = Celery(
    "trading_service",
    broker=RABBITMQ_URL,
    backend="redis://localhost:6379/2"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, http_client
    
    # Startup
    Base.metadata.create_all(bind=engine)
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    http_client = httpx.AsyncClient(timeout=30.0)
    
    # Start background tasks
    asyncio.create_task(process_pending_orders())
    asyncio.create_task(update_positions())
    
    logger.info("Trading Service started successfully")
    
    yield
    
    # Shutdown
    if redis_client:
        redis_client.close()
    if http_client:
        await http_client.aclose()
    logger.info("Trading Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Trading Service",
    description="Order management and trade execution for Casa de Valores",
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

# Utility functions
def get_current_user_id(request: Request) -> str:
    """Extract user ID from request headers"""
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in request"
        )
    return user_id

async def get_market_price(symbol: str) -> Optional[float]:
    """Get current market price for a symbol"""
    try:
        response = await http_client.get(f"{MARKET_DATA_SERVICE_URL}/api/v1/market-data/{symbol}")
        if response.status_code == 200:
            data = response.json()
            return float(data.get("price", 0))
    except Exception as e:
        logger.error(f"Error fetching market price for {symbol}: {e}")
    return None

def validate_order(order_data: OrderCreateRequest, user_id: str, db: Session) -> Dict[str, Any]:
    """Validate order before placement"""
    errors = []
    
    # Basic validation
    if order_data.quantity <= 0:
        errors.append("Quantity must be positive")
    
    if order_data.order_type == OrderType.LIMIT and (not order_data.price or order_data.price <= 0):
        errors.append("Limit orders must have a positive price")
    
    # Check user's buying power for buy orders
    if order_data.side == OrderSide.BUY:
        # Get user's cash balance (simplified - would integrate with portfolio service)
        cash_balance = get_user_cash_balance(user_id, db)
        estimated_cost = float(order_data.quantity) * (order_data.price or 0)
        
        if estimated_cost > cash_balance:
            errors.append("Insufficient buying power")
    
    # Check user's position for sell orders
    if order_data.side == OrderSide.SELL:
        position = get_user_position(user_id, order_data.symbol, db)
        if not position or position.quantity < order_data.quantity:
            errors.append("Insufficient shares to sell")
    
    return {"valid": len(errors) == 0, "errors": errors}

def get_user_cash_balance(user_id: str, db: Session) -> float:
    """Get user's cash balance (simplified implementation)"""
    # In a real implementation, this would query the portfolio service
    # For now, return a default balance
    return 10000.0

def get_user_position(user_id: str, symbol: str, db: Session) -> Optional[Position]:
    """Get user's position for a symbol"""
    return db.query(Position).filter(
        Position.user_id == user_id,
        Position.symbol == symbol
    ).first()

def update_position_after_trade(trade: Trade, db: Session):
    """Update user position after trade execution"""
    position = get_user_position(trade.user_id, trade.symbol, db)
    
    if not position:
        # Create new position
        position = Position(
            user_id=trade.user_id,
            symbol=trade.symbol,
            quantity=0,
            average_cost=0,
            market_value=0,
            unrealized_pnl=0
        )
        db.add(position)
    
    # Update position based on trade
    if trade.side == OrderSide.BUY:
        # Calculate new average cost
        total_cost = (position.quantity * position.average_cost) + (trade.quantity * trade.price)
        total_quantity = position.quantity + trade.quantity
        position.average_cost = total_cost / total_quantity if total_quantity > 0 else 0
        position.quantity = total_quantity
    else:  # SELL
        position.quantity -= trade.quantity
        if position.quantity <= 0:
            position.quantity = 0
            position.average_cost = 0
    
    # Update market value (would get current price from market data service)
    current_price = trade.price  # Simplified
    position.market_value = position.quantity * current_price
    position.unrealized_pnl = (current_price - position.average_cost) * position.quantity
    position.updated_at = datetime.utcnow()
    
    db.commit()

async def execute_market_order(order: Order, db: Session) -> Optional[Trade]:
    """Execute a market order"""
    try:
        # Get current market price
        market_price = await get_market_price(order.symbol)
        if not market_price:
            logger.error(f"Could not get market price for {order.symbol}")
            return None
        
        # Create trade
        trade = Trade(
            id=str(uuid.uuid4()),
            order_id=order.id,
            user_id=order.user_id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            price=Decimal(str(market_price)),
            commission=calculate_commission(order.quantity, market_price),
            executed_at=datetime.utcnow()
        )
        
        db.add(trade)
        
        # Update order status
        order.status = OrderStatus.FILLED
        order.filled_quantity = order.quantity
        order.average_fill_price = Decimal(str(market_price))
        order.updated_at = datetime.utcnow()
        
        # Update position
        update_position_after_trade(trade, db)
        
        db.commit()
        
        # Send trade confirmation (would integrate with notification service)
        await send_trade_confirmation(trade)
        
        return trade
        
    except Exception as e:
        logger.error(f"Error executing market order {order.id}: {e}")
        db.rollback()
        return None

def calculate_commission(quantity: int, price: float) -> Decimal:
    """Calculate trading commission"""
    # Simplified commission calculation
    base_commission = Decimal("0.01")  # $0.01 per share
    min_commission = Decimal("1.00")   # Minimum $1.00
    
    commission = base_commission * Decimal(str(quantity))
    return max(commission, min_commission)

async def send_trade_confirmation(trade: Trade):
    """Send trade confirmation notification"""
    # Would integrate with notification service
    logger.info(f"Trade confirmation: {trade.id} - {trade.symbol} {trade.side} {trade.quantity}@{trade.price}")

# Background tasks
async def process_pending_orders():
    """Background task to process pending orders"""
    while True:
        try:
            db = next(get_db())
            
            # Get pending orders
            pending_orders = db.query(Order).filter(
                Order.status == OrderStatus.PENDING
            ).all()
            
            for order in pending_orders:
                if order.order_type == OrderType.MARKET:
                    # Execute market orders immediately
                    await execute_market_order(order, db)
                elif order.order_type == OrderType.LIMIT:
                    # Check if limit order can be executed
                    market_price = await get_market_price(order.symbol)
                    if market_price:
                        should_execute = False
                        
                        if order.side == OrderSide.BUY and market_price <= float(order.price):
                            should_execute = True
                        elif order.side == OrderSide.SELL and market_price >= float(order.price):
                            should_execute = True
                        
                        if should_execute:
                            await execute_market_order(order, db)
            
            db.close()
            await asyncio.sleep(1)  # Check every second
            
        except Exception as e:
            logger.error(f"Error in order processing: {e}")
            await asyncio.sleep(5)

async def update_positions():
    """Background task to update position values"""
    while True:
        try:
            db = next(get_db())
            
            # Get all positions
            positions = db.query(Position).filter(Position.quantity > 0).all()
            
            for position in positions:
                # Get current market price
                market_price = await get_market_price(position.symbol)
                if market_price:
                    position.market_value = position.quantity * Decimal(str(market_price))
                    position.unrealized_pnl = (Decimal(str(market_price)) - position.average_cost) * position.quantity
                    position.updated_at = datetime.utcnow()
            
            db.commit()
            db.close()
            await asyncio.sleep(30)  # Update every 30 seconds
            
        except Exception as e:
            logger.error(f"Error updating positions: {e}")
            await asyncio.sleep(60)

# API Endpoints
@app.post("/api/v1/trading/orders", response_model=OrderResponse)
async def place_order(
    order_data: OrderCreateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Place a new trading order"""
    user_id = get_current_user_id(request)
    
    # Validate order
    validation = validate_order(order_data, user_id, db)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": validation["errors"]}
        )
    
    # Create order
    order = Order(
        id=str(uuid.uuid4()),
        user_id=user_id,
        symbol=order_data.symbol.upper(),
        order_type=order_data.order_type,
        side=order_data.side,
        quantity=order_data.quantity,
        price=Decimal(str(order_data.price)) if order_data.price else None,
        status=OrderStatus.PENDING,
        created_at=datetime.utcnow()
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # For market orders, try to execute immediately
    if order.order_type == OrderType.MARKET:
        trade = await execute_market_order(order, db)
        if trade:
            logger.info(f"Market order {order.id} executed immediately")
    
    return OrderResponse.from_orm(order)

@app.get("/api/v1/trading/orders", response_model=List[OrderResponse])
async def get_user_orders(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[OrderStatus] = None,
    db: Session = Depends(get_db)
):
    """Get user's trading orders"""
    user_id = get_current_user_id(request)
    
    query = db.query(Order).filter(Order.user_id == user_id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return [OrderResponse.from_orm(order) for order in orders]

@app.get("/api/v1/trading/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get specific order details"""
    user_id = get_current_user_id(request)
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderResponse.from_orm(order)

@app.put("/api/v1/trading/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Cancel a pending order"""
    user_id = get_current_user_id(request)
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending orders can be cancelled"
        )
    
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Order cancelled successfully"}

@app.get("/api/v1/trading/trades", response_model=List[TradeResponse])
async def get_user_trades(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    symbol: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user's trade history"""
    user_id = get_current_user_id(request)
    
    query = db.query(Trade).filter(Trade.user_id == user_id)
    
    if symbol:
        query = query.filter(Trade.symbol == symbol.upper())
    
    trades = query.order_by(Trade.executed_at.desc()).offset(skip).limit(limit).all()
    
    return [TradeResponse.from_orm(trade) for trade in trades]

@app.get("/api/v1/trading/positions", response_model=List[PositionResponse])
async def get_user_positions(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get user's current positions"""
    user_id = get_current_user_id(request)
    
    positions = db.query(Position).filter(
        Position.user_id == user_id,
        Position.quantity > 0
    ).all()
    
    return [PositionResponse.from_orm(position) for position in positions]

@app.get("/api/v1/trading/positions/{symbol}", response_model=PositionResponse)
async def get_position(
    symbol: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get specific position details"""
    user_id = get_current_user_id(request)
    
    position = db.query(Position).filter(
        Position.user_id == user_id,
        Position.symbol == symbol.upper()
    ).first()
    
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    return PositionResponse.from_orm(position)

@app.get("/api/v1/trading/stats", response_model=TradingStatsResponse)
async def get_trading_stats(
    request: Request,
    period_days: int = 30,
    db: Session = Depends(get_db)
):
    """Get user's trading statistics"""
    user_id = get_current_user_id(request)
    
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Get trades in period
    trades = db.query(Trade).filter(
        Trade.user_id == user_id,
        Trade.executed_at >= start_date
    ).all()
    
    # Calculate statistics
    total_trades = len(trades)
    total_volume = sum(float(trade.quantity * trade.price) for trade in trades)
    total_commission = sum(float(trade.commission) for trade in trades)
    
    buy_trades = [t for t in trades if t.side == OrderSide.BUY]
    sell_trades = [t for t in trades if t.side == OrderSide.SELL]
    
    # Get current positions
    positions = db.query(Position).filter(
        Position.user_id == user_id,
        Position.quantity > 0
    ).all()
    
    total_position_value = sum(float(pos.market_value) for pos in positions)
    total_unrealized_pnl = sum(float(pos.unrealized_pnl) for pos in positions)
    
    return TradingStatsResponse(
        total_trades=total_trades,
        total_volume=total_volume,
        total_commission=total_commission,
        buy_trades=len(buy_trades),
        sell_trades=len(sell_trades),
        total_position_value=total_position_value,
        total_unrealized_pnl=total_unrealized_pnl,
        period_days=period_days
    )

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "trading",
        "redis_connected": redis_client.ping() if redis_client else False
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