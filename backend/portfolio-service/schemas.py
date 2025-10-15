"""
Portfolio Service Schemas - Casa de Valores Information System
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class PortfolioCreateRequest(BaseModel):
    """Schema for creating a new portfolio"""
    name: str
    description: Optional[str] = None
    initial_cash: float = 0.0
    currency: str = "USD"
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Portfolio name cannot be empty')
        return v.strip()
    
    @validator('initial_cash')
    def validate_initial_cash(cls, v):
        if v < 0:
            raise ValueError('Initial cash cannot be negative')
        return v

class PortfolioUpdateRequest(BaseModel):
    """Schema for updating a portfolio"""
    name: Optional[str] = None
    description: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 1:
            raise ValueError('Portfolio name cannot be empty')
        return v.strip() if v else None

class PortfolioResponse(BaseModel):
    """Schema for portfolio response"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    total_value: Decimal
    cash_balance: Decimal
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class HoldingResponse(BaseModel):
    """Schema for holding response"""
    id: str
    portfolio_id: str
    symbol: str
    quantity: Decimal
    average_cost: Decimal
    current_price: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    sector: Optional[str] = None
    last_updated: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class PerformanceResponse(BaseModel):
    """Schema for portfolio performance response"""
    portfolio_id: str
    total_value: float
    total_return: float
    total_return_pct: float
    cash_balance: float
    invested_amount: float
    holdings_count: int
    period_days: int
    historical_values: List[Dict[str, Any]] = []

class AssetAllocationResponse(BaseModel):
    """Schema for asset allocation response"""
    symbol: str
    quantity: float
    market_value: float
    percentage: float
    sector: Optional[str] = None

class RebalanceRequest(BaseModel):
    """Schema for portfolio rebalancing request"""
    target_allocations: Dict[str, float]  # symbol -> target percentage
    
    @validator('target_allocations')
    def validate_allocations(cls, v):
        total = sum(v.values())
        if abs(total - 100.0) > 0.01:  # Allow small rounding errors
            raise ValueError('Target allocations must sum to 100%')
        
        for symbol, percentage in v.items():
            if percentage < 0 or percentage > 100:
                raise ValueError(f'Invalid percentage for {symbol}: {percentage}')
        
        return v

class WatchlistCreateRequest(BaseModel):
    """Schema for creating a watchlist"""
    name: str
    description: Optional[str] = None
    symbols: List[str] = []
    is_public: bool = False
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Watchlist name cannot be empty')
        return v.strip()
    
    @validator('symbols')
    def validate_symbols(cls, v):
        return [symbol.upper().strip() for symbol in v]

class WatchlistResponse(BaseModel):
    """Schema for watchlist response"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    is_public: bool
    symbols: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

class PortfolioSummaryResponse(BaseModel):
    """Schema for portfolio summary response"""
    total_portfolios: int
    total_value: float
    total_cash: float
    total_invested: float
    total_pnl: float
    total_return_pct: float
    best_performer: Optional[Dict[str, Any]] = None
    worst_performer: Optional[Dict[str, Any]] = None

class HoldingSummaryResponse(BaseModel):
    """Schema for holding summary response"""
    symbol: str
    total_quantity: float
    total_value: float
    average_cost: float
    current_price: float
    total_pnl: float
    return_pct: float
    portfolios: List[str] = []  # Portfolio IDs where this holding exists

class PortfolioComparisonResponse(BaseModel):
    """Schema for portfolio comparison response"""
    portfolios: List[Dict[str, Any]]
    comparison_metrics: Dict[str, Any]
    period_days: int

class RiskMetricsResponse(BaseModel):
    """Schema for portfolio risk metrics response"""
    portfolio_id: str
    beta: Optional[float] = None
    alpha: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    volatility: Optional[float] = None
    max_drawdown: Optional[float] = None
    var_95: Optional[float] = None  # Value at Risk 95%
    var_99: Optional[float] = None  # Value at Risk 99%
    correlation_sp500: Optional[float] = None

class DiversificationResponse(BaseModel):
    """Schema for portfolio diversification analysis"""
    portfolio_id: str
    sector_allocation: Dict[str, float]
    geographic_allocation: Dict[str, float]
    asset_class_allocation: Dict[str, float]
    concentration_risk: float  # Percentage in top 5 holdings
    diversification_score: float  # 0-100 scale

class PortfolioOptimizationRequest(BaseModel):
    """Schema for portfolio optimization request"""
    portfolio_id: str
    optimization_type: str = "max_sharpe"  # max_sharpe, min_variance, max_return
    constraints: Dict[str, Any] = {}
    target_return: Optional[float] = None
    risk_tolerance: str = "moderate"  # conservative, moderate, aggressive

class PortfolioOptimizationResponse(BaseModel):
    """Schema for portfolio optimization response"""
    portfolio_id: str
    current_allocation: Dict[str, float]
    recommended_allocation: Dict[str, float]
    expected_return: float
    expected_risk: float
    sharpe_ratio: float
    rebalancing_trades: List[Dict[str, Any]] = []