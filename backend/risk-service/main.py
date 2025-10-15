"""
Risk Management Service - Casa de Valores Information System
Handles risk analysis, VaR calculations, and risk monitoring
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
import numpy as np
import httpx

from models import RiskMetric, RiskLimit, StressTest, RiskAlert
from database import get_db, engine, Base
from schemas import (
    VaRRequest, VaRResponse, StressTestRequest, StressTestResponse,
    RiskLimitRequest, RiskLimitResponse, RiskAlertResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql://app_user:app_password@localhost:3306/casa_valores")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/5")
PORTFOLIO_SERVICE_URL = os.getenv("PORTFOLIO_SERVICE_URL", "http://portfolio-service:8000")
MARKET_DATA_SERVICE_URL = os.getenv("MARKET_DATA_SERVICE_URL", "http://market-data-service:8000")

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
    asyncio.create_task(monitor_risk_limits())
    asyncio.create_task(calculate_portfolio_risks())
    
    logger.info("Risk Management Service started successfully")
    
    yield
    
    # Shutdown
    if redis_client:
        redis_client.close()
    if http_client:
        await http_client.aclose()
    logger.info("Risk Management Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Risk Management Service",
    description="Risk analysis and monitoring for Casa de Valores",
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

async def get_portfolio_data(portfolio_id: str) -> Optional[Dict]:
    """Get portfolio data from portfolio service"""
    try:
        response = await http_client.get(f"{PORTFOLIO_SERVICE_URL}/api/v1/portfolio/{portfolio_id}")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"Error fetching portfolio data: {e}")
    return None

async def get_historical_prices(symbols: List[str], days: int = 252) -> Dict[str, List[float]]:
    """Get historical prices for symbols"""
    try:
        historical_data = {}
        for symbol in symbols:
            # Simulate historical data (replace with real API call)
            np.random.seed(42)  # For reproducible results
            prices = []
            base_price = 100.0
            for _ in range(days):
                change = np.random.normal(0, 0.02)  # 2% daily volatility
                base_price *= (1 + change)
                prices.append(base_price)
            historical_data[symbol] = prices
        return historical_data
    except Exception as e:
        logger.error(f"Error fetching historical prices: {e}")
        return {}

def calculate_var(returns: List[float], confidence_level: float = 0.95) -> float:
    """Calculate Value at Risk using historical simulation"""
    if not returns:
        return 0.0
    
    returns_array = np.array(returns)
    return float(np.percentile(returns_array, (1 - confidence_level) * 100))

def calculate_expected_shortfall(returns: List[float], confidence_level: float = 0.95) -> float:
    """Calculate Expected Shortfall (Conditional VaR)"""
    if not returns:
        return 0.0
    
    var = calculate_var(returns, confidence_level)
    returns_array = np.array(returns)
    tail_returns = returns_array[returns_array <= var]
    
    return float(np.mean(tail_returns)) if len(tail_returns) > 0 else var

def calculate_portfolio_beta(portfolio_returns: List[float], market_returns: List[float]) -> float:
    """Calculate portfolio beta"""
    if len(portfolio_returns) != len(market_returns) or len(portfolio_returns) < 2:
        return 1.0
    
    portfolio_array = np.array(portfolio_returns)
    market_array = np.array(market_returns)
    
    covariance = np.cov(portfolio_array, market_array)[0, 1]
    market_variance = np.var(market_array)
    
    return float(covariance / market_variance) if market_variance != 0 else 1.0

def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
    """Calculate Sharpe ratio"""
    if not returns:
        return 0.0
    
    returns_array = np.array(returns)
    excess_returns = returns_array - (risk_free_rate / 252)  # Daily risk-free rate
    
    return float(np.mean(excess_returns) / np.std(excess_returns)) if np.std(excess_returns) != 0 else 0.0

def monte_carlo_simulation(portfolio_value: float, returns: List[float], days: int = 252, simulations: int = 10000) -> List[float]:
    """Run Monte Carlo simulation for portfolio"""
    if not returns:
        return [portfolio_value] * simulations
    
    returns_array = np.array(returns)
    mean_return = np.mean(returns_array)
    std_return = np.std(returns_array)
    
    final_values = []
    for _ in range(simulations):
        value = portfolio_value
        for _ in range(days):
            daily_return = np.random.normal(mean_return, std_return)
            value *= (1 + daily_return)
        final_values.append(value)
    
    return final_values

async def monitor_risk_limits():
    """Background task to monitor risk limits"""
    while True:
        try:
            db = next(get_db())
            
            # Get all active risk limits
            risk_limits = db.query(RiskLimit).filter(RiskLimit.is_active == True).all()
            
            for limit in risk_limits:
                # Check if limit is breached
                current_value = await get_current_risk_value(limit)
                
                if current_value > float(limit.limit_value):
                    # Create risk alert
                    alert = RiskAlert(
                        user_id=limit.user_id,
                        portfolio_id=limit.portfolio_id,
                        alert_type="LIMIT_BREACH",
                        severity="HIGH",
                        message=f"{limit.limit_type} limit breached: {current_value:.2f} > {limit.limit_value}",
                        current_value=Decimal(str(current_value)),
                        limit_value=limit.limit_value,
                        created_at=datetime.utcnow()
                    )
                    db.add(alert)
            
            db.commit()
            db.close()
            await asyncio.sleep(60)  # Check every minute
            
        except Exception as e:
            logger.error(f"Error monitoring risk limits: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes on error

async def get_current_risk_value(risk_limit: RiskLimit) -> float:
    """Get current risk value for a limit"""
    # This would implement actual risk calculation based on limit type
    # For now, return a simulated value
    return np.random.uniform(0, float(risk_limit.limit_value) * 1.2)

async def calculate_portfolio_risks():
    """Background task to calculate portfolio risk metrics"""
    while True:
        try:
            db = next(get_db())
            
            # This would get all portfolios and calculate their risk metrics
            # For now, just log that it's running
            logger.info("Calculating portfolio risk metrics...")
            
            db.close()
            await asyncio.sleep(3600)  # Calculate every hour
            
        except Exception as e:
            logger.error(f"Error calculating portfolio risks: {e}")
            await asyncio.sleep(1800)  # Wait 30 minutes on error

# API Endpoints
@app.post("/api/v1/risk/var", response_model=VaRResponse)
async def calculate_portfolio_var(
    var_request: VaRRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Calculate Value at Risk for a portfolio"""
    user_id = get_current_user_id(request)
    
    # Get portfolio data
    portfolio_data = await get_portfolio_data(var_request.portfolio_id)
    if not portfolio_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get historical data for portfolio holdings
    symbols = ["AAPL", "GOOGL", "MSFT"]  # Would get from portfolio
    historical_data = await get_historical_prices(symbols, var_request.time_horizon)
    
    # Calculate portfolio returns (simplified)
    portfolio_returns = []
    for i in range(1, len(historical_data["AAPL"])):
        daily_return = (historical_data["AAPL"][i] - historical_data["AAPL"][i-1]) / historical_data["AAPL"][i-1]
        portfolio_returns.append(daily_return)
    
    # Calculate VaR
    var_value = calculate_var(portfolio_returns, var_request.confidence_level)
    expected_shortfall = calculate_expected_shortfall(portfolio_returns, var_request.confidence_level)
    
    # Convert to dollar amount
    portfolio_value = float(portfolio_data.get("total_value", 0))
    var_dollar = abs(var_value * portfolio_value)
    es_dollar = abs(expected_shortfall * portfolio_value)
    
    # Store result
    risk_metric = RiskMetric(
        portfolio_id=var_request.portfolio_id,
        metric_type="VAR",
        value=Decimal(str(var_dollar)),
        confidence_level=Decimal(str(var_request.confidence_level)),
        time_horizon=var_request.time_horizon,
        calculation_date=datetime.utcnow()
    )
    db.add(risk_metric)
    db.commit()
    
    return VaRResponse(
        portfolio_id=var_request.portfolio_id,
        var_value=var_dollar,
        expected_shortfall=es_dollar,
        confidence_level=var_request.confidence_level,
        time_horizon=var_request.time_horizon,
        portfolio_value=portfolio_value,
        calculation_date=datetime.utcnow()
    )

@app.post("/api/v1/risk/stress-test", response_model=StressTestResponse)
async def run_stress_test(
    stress_request: StressTestRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Run stress test on portfolio"""
    user_id = get_current_user_id(request)
    
    # Get portfolio data
    portfolio_data = await get_portfolio_data(stress_request.portfolio_id)
    if not portfolio_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    portfolio_value = float(portfolio_data.get("total_value", 0))
    
    # Run stress test scenarios
    scenarios = []
    for scenario in stress_request.scenarios:
        # Apply scenario shock to portfolio
        shocked_value = portfolio_value * (1 + scenario["shock"] / 100)
        pnl = shocked_value - portfolio_value
        
        scenarios.append({
            "name": scenario["name"],
            "description": scenario.get("description", ""),
            "shock_percentage": scenario["shock"],
            "portfolio_value_before": portfolio_value,
            "portfolio_value_after": shocked_value,
            "pnl": pnl,
            "pnl_percentage": (pnl / portfolio_value * 100) if portfolio_value > 0 else 0
        })
    
    # Store stress test result
    stress_test = StressTest(
        portfolio_id=stress_request.portfolio_id,
        test_name=stress_request.test_name,
        scenarios_data=json.dumps(scenarios),
        created_at=datetime.utcnow()
    )
    db.add(stress_test)
    db.commit()
    
    return StressTestResponse(
        portfolio_id=stress_request.portfolio_id,
        test_name=stress_request.test_name,
        scenarios=scenarios,
        worst_case_pnl=min(s["pnl"] for s in scenarios),
        best_case_pnl=max(s["pnl"] for s in scenarios),
        test_date=datetime.utcnow()
    )

@app.post("/api/v1/risk/limits", response_model=RiskLimitResponse)
async def create_risk_limit(
    limit_request: RiskLimitRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a risk limit"""
    user_id = get_current_user_id(request)
    
    risk_limit = RiskLimit(
        user_id=user_id,
        portfolio_id=limit_request.portfolio_id,
        limit_type=limit_request.limit_type,
        limit_value=Decimal(str(limit_request.limit_value)),
        currency=limit_request.currency,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(risk_limit)
    db.commit()
    db.refresh(risk_limit)
    
    return RiskLimitResponse.from_orm(risk_limit)

@app.get("/api/v1/risk/limits", response_model=List[RiskLimitResponse])
async def get_risk_limits(
    request: Request,
    portfolio_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user's risk limits"""
    user_id = get_current_user_id(request)
    
    query = db.query(RiskLimit).filter(RiskLimit.user_id == user_id)
    
    if portfolio_id:
        query = query.filter(RiskLimit.portfolio_id == portfolio_id)
    
    limits = query.all()
    
    return [RiskLimitResponse.from_orm(limit) for limit in limits]

@app.get("/api/v1/risk/alerts", response_model=List[RiskAlertResponse])
async def get_risk_alerts(
    request: Request,
    portfolio_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user's risk alerts"""
    user_id = get_current_user_id(request)
    
    query = db.query(RiskAlert).filter(RiskAlert.user_id == user_id)
    
    if portfolio_id:
        query = query.filter(RiskAlert.portfolio_id == portfolio_id)
    
    if severity:
        query = query.filter(RiskAlert.severity == severity)
    
    alerts = query.order_by(RiskAlert.created_at.desc()).limit(100).all()
    
    return [RiskAlertResponse.from_orm(alert) for alert in alerts]

@app.get("/api/v1/risk/portfolio/{portfolio_id}/metrics")
async def get_portfolio_risk_metrics(
    portfolio_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get comprehensive risk metrics for a portfolio"""
    user_id = get_current_user_id(request)
    
    # Get portfolio data
    portfolio_data = await get_portfolio_data(portfolio_id)
    if not portfolio_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get historical data and calculate metrics
    symbols = ["AAPL", "GOOGL", "MSFT"]  # Would get from portfolio
    historical_data = await get_historical_prices(symbols, 252)
    
    # Calculate portfolio returns
    portfolio_returns = []
    market_returns = []  # S&P 500 proxy
    
    for i in range(1, len(historical_data["AAPL"])):
        portfolio_return = (historical_data["AAPL"][i] - historical_data["AAPL"][i-1]) / historical_data["AAPL"][i-1]
        market_return = np.random.normal(0.0008, 0.012)  # Simulated market return
        portfolio_returns.append(portfolio_return)
        market_returns.append(market_return)
    
    # Calculate risk metrics
    var_95 = calculate_var(portfolio_returns, 0.95)
    var_99 = calculate_var(portfolio_returns, 0.99)
    expected_shortfall = calculate_expected_shortfall(portfolio_returns, 0.95)
    beta = calculate_portfolio_beta(portfolio_returns, market_returns)
    sharpe_ratio = calculate_sharpe_ratio(portfolio_returns)
    
    portfolio_value = float(portfolio_data.get("total_value", 0))
    
    return {
        "portfolio_id": portfolio_id,
        "portfolio_value": portfolio_value,
        "var_95_percent": abs(var_95 * portfolio_value),
        "var_99_percent": abs(var_99 * portfolio_value),
        "expected_shortfall": abs(expected_shortfall * portfolio_value),
        "beta": beta,
        "sharpe_ratio": sharpe_ratio,
        "volatility": float(np.std(portfolio_returns) * np.sqrt(252)),  # Annualized
        "max_drawdown": 0.15,  # Simplified
        "correlation_sp500": float(np.corrcoef(portfolio_returns, market_returns)[0, 1]),
        "calculation_date": datetime.utcnow().isoformat()
    }

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "risk-management",
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