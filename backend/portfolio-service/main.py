"""
Portfolio Service - Casa de Valores Information System
Handles portfolio management, performance analytics, and asset allocation
"""

from fastapi import FastAPI, HTTPException, Depends, Request, status
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
import httpx

from models import Portfolio, Holding, PerformanceMetric, AssetAllocation
from database import get_db, engine, Base
from schemas import (
    PortfolioCreateRequest, PortfolioResponse, HoldingResponse,
    PerformanceResponse, AssetAllocationResponse, RebalanceRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql://app_user:app_password@localhost:3306/casa_valores")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/4")
MARKET_DATA_SERVICE_URL = os.getenv("MARKET_DATA_SERVICE_URL", "http://market-data-service:8000")
TRADING_SERVICE_URL = os.getenv("TRADING_SERVICE_URL", "http://trading-service:8000")

# Global variables
redis_client = None
http_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, http_client
    
    # Startup
    Base.metadata.create_all(bind=engine)
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    http_client = httpx.AsyncClient(timeout=30.0)
    
    # Start background tasks
    asyncio.create_task(update_portfolio_values())
    
    logger.info("Portfolio Service started successfully")
    
    yield
    
    # Shutdown
    if redis_client:
        redis_client.close()
    if http_client:
        await http_client.aclose()
    logger.info("Portfolio Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Portfolio Management Service",
    description="Portfolio management and analytics for Casa de Valores",
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

def calculate_portfolio_metrics(portfolio: Portfolio, holdings: List[Holding]) -> Dict[str, Any]:
    """Calculate portfolio performance metrics"""
    total_value = sum(float(holding.market_value) for holding in holdings)
    total_cost = sum(float(holding.quantity * holding.average_cost) for holding in holdings)
    total_pnl = total_value - total_cost
    
    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_pnl": total_pnl,
        "total_return_pct": (total_pnl / total_cost * 100) if total_cost > 0 else 0,
        "cash_balance": float(portfolio.cash_balance),
        "invested_amount": total_cost,
        "holdings_count": len(holdings)
    }

async def update_portfolio_values():
    """Background task to update portfolio values"""
    while True:
        try:
            db = next(get_db())
            
            # Get all portfolios
            portfolios = db.query(Portfolio).all()
            
            for portfolio in portfolios:
                holdings = db.query(Holding).filter(
                    Holding.portfolio_id == portfolio.id,
                    Holding.quantity > 0
                ).all()
                
                total_value = Decimal('0')
                
                for holding in holdings:
                    # Get current market price
                    market_price = await get_market_price(holding.symbol)
                    if market_price:
                        holding.current_price = Decimal(str(market_price))
                        holding.market_value = holding.quantity * holding.current_price
                        holding.unrealized_pnl = (holding.current_price - holding.average_cost) * holding.quantity
                        total_value += holding.market_value
                
                # Update portfolio total value
                portfolio.total_value = total_value + portfolio.cash_balance
                portfolio.updated_at = datetime.utcnow()
            
            db.commit()
            db.close()
            await asyncio.sleep(30)  # Update every 30 seconds
            
        except Exception as e:
            logger.error(f"Error updating portfolio values: {e}")
            await asyncio.sleep(60)

# API Endpoints
@app.post("/api/v1/portfolio", response_model=PortfolioResponse)
async def create_portfolio(
    portfolio_data: PortfolioCreateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new portfolio"""
    user_id = get_current_user_id(request)
    
    # Check if user already has a portfolio with this name
    existing = db.query(Portfolio).filter(
        Portfolio.user_id == user_id,
        Portfolio.name == portfolio_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portfolio with this name already exists"
        )
    
    portfolio = Portfolio(
        user_id=user_id,
        name=portfolio_data.name,
        description=portfolio_data.description,
        cash_balance=Decimal(str(portfolio_data.initial_cash)),
        total_value=Decimal(str(portfolio_data.initial_cash)),
        created_at=datetime.utcnow()
    )
    
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    
    return PortfolioResponse.from_orm(portfolio)

@app.get("/api/v1/portfolio", response_model=List[PortfolioResponse])
async def get_user_portfolios(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get user's portfolios"""
    user_id = get_current_user_id(request)
    
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    
    return [PortfolioResponse.from_orm(portfolio) for portfolio in portfolios]

@app.get("/api/v1/portfolio/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get specific portfolio details"""
    user_id = get_current_user_id(request)
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return PortfolioResponse.from_orm(portfolio)

@app.get("/api/v1/portfolio/{portfolio_id}/holdings", response_model=List[HoldingResponse])
async def get_portfolio_holdings(
    portfolio_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get portfolio holdings"""
    user_id = get_current_user_id(request)
    
    # Verify portfolio ownership
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.quantity > 0
    ).all()
    
    return [HoldingResponse.from_orm(holding) for holding in holdings]

@app.get("/api/v1/portfolio/{portfolio_id}/performance", response_model=PerformanceResponse)
async def get_portfolio_performance(
    portfolio_id: str,
    request: Request,
    period_days: int = 30,
    db: Session = Depends(get_db)
):
    """Get portfolio performance metrics"""
    user_id = get_current_user_id(request)
    
    # Verify portfolio ownership
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.quantity > 0
    ).all()
    
    metrics = calculate_portfolio_metrics(portfolio, holdings)
    
    # Get historical performance (simplified)
    start_date = datetime.utcnow() - timedelta(days=period_days)
    historical_metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.portfolio_id == portfolio_id,
        PerformanceMetric.date >= start_date
    ).order_by(PerformanceMetric.date).all()
    
    return PerformanceResponse(
        portfolio_id=portfolio_id,
        total_value=metrics["total_value"],
        total_return=metrics["total_pnl"],
        total_return_pct=metrics["total_return_pct"],
        cash_balance=metrics["cash_balance"],
        invested_amount=metrics["invested_amount"],
        holdings_count=metrics["holdings_count"],
        period_days=period_days,
        historical_values=[
            {
                "date": metric.date.isoformat(),
                "value": float(metric.total_value),
                "return_pct": float(metric.return_pct)
            }
            for metric in historical_metrics
        ]
    )

@app.get("/api/v1/portfolio/{portfolio_id}/allocation", response_model=List[AssetAllocationResponse])
async def get_asset_allocation(
    portfolio_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get portfolio asset allocation"""
    user_id = get_current_user_id(request)
    
    # Verify portfolio ownership
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.quantity > 0
    ).all()
    
    total_value = sum(float(holding.market_value) for holding in holdings)
    
    allocation = []
    for holding in holdings:
        percentage = (float(holding.market_value) / total_value * 100) if total_value > 0 else 0
        allocation.append(AssetAllocationResponse(
            symbol=holding.symbol,
            quantity=float(holding.quantity),
            market_value=float(holding.market_value),
            percentage=percentage,
            sector="Technology"  # Would get from security master data
        ))
    
    return allocation

@app.post("/api/v1/portfolio/{portfolio_id}/rebalance")
async def rebalance_portfolio(
    portfolio_id: str,
    rebalance_data: RebalanceRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Rebalance portfolio according to target allocation"""
    user_id = get_current_user_id(request)
    
    # Verify portfolio ownership
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # This would implement rebalancing logic
    # For now, return a simple response
    return {
        "message": "Rebalancing initiated",
        "portfolio_id": portfolio_id,
        "target_allocations": rebalance_data.target_allocations
    }

@app.delete("/api/v1/portfolio/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a portfolio"""
    user_id = get_current_user_id(request)
    
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Check if portfolio has holdings
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id,
        Holding.quantity > 0
    ).first()
    
    if holdings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete portfolio with active holdings"
        )
    
    db.delete(portfolio)
    db.commit()
    
    return {"message": "Portfolio deleted successfully"}

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "portfolio",
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