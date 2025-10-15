"""
Market Data Service Schemas - Casa de Valores Information System
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class IndicatorType(str, Enum):
    SMA = "sma"
    EMA = "ema"
    RSI = "rsi"
    MACD = "macd"
    BOLLINGER = "bollinger"
    STOCHASTIC = "stochastic"

class AlertCondition(str, Enum):
    ABOVE = "above"
    BELOW = "below"
    EQUALS = "equals"

class MarketDataResponse(BaseModel):
    """Market data response schema"""
    symbol: str
    price: float
    volume: int
    change: float
    change_percent: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    open: Optional[float] = None
    timestamp: str
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()

class HistoricalDataRequest(BaseModel):
    """Historical data request schema"""
    symbol: str
    start_date: datetime
    end_date: datetime
    interval: Optional[str] = "1d"  # 1m, 5m, 15m, 30m, 1h, 1d
    limit: Optional[int] = 1000
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class HistoricalDataResponse(BaseModel):
    """Historical data response schema"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None

class TechnicalIndicatorRequest(BaseModel):
    """Technical indicator request schema"""
    symbol: str
    indicators: List[IndicatorType]
    period: Optional[int] = 20
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('period')
    def validate_period(cls, v):
        if v < 1 or v > 200:
            raise ValueError('period must be between 1 and 200')
        return v

class TechnicalIndicatorResponse(BaseModel):
    """Technical indicator response schema"""
    symbol: str
    indicators: Dict[str, Any]
    timestamps: List[str]

class MarketAlertRequest(BaseModel):
    """Market alert request schema"""
    user_id: str
    symbol: str
    condition: AlertCondition
    target_value: float
    message: Optional[str] = None
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('target_value')
    def validate_target_value(cls, v):
        if v <= 0:
            raise ValueError('target_value must be positive')
        return v

class MarketAlertResponse(BaseModel):
    """Market alert response schema"""
    id: str
    user_id: str
    symbol: str
    condition: str
    target_value: float
    message: Optional[str] = None
    is_active: bool
    created_at: datetime
    triggered_at: Optional[datetime] = None

class SubscriptionRequest(BaseModel):
    """Subscription request schema"""
    user_id: str
    symbols: List[str]
    subscription_type: str = "real_time"
    
    @validator('symbols')
    def validate_symbols(cls, v):
        return [symbol.upper().strip() for symbol in v]
    
    @validator('symbols')
    def validate_symbols_limit(cls, v):
        if len(v) > 50:
            raise ValueError('Maximum 50 symbols allowed per subscription')
        return v

class MarketOverviewResponse(BaseModel):
    """Market overview response schema"""
    timestamp: str
    market_status: str
    major_stocks: List[MarketDataResponse]
    indices: Optional[List[Dict[str, Any]]] = None

class MarketNewsResponse(BaseModel):
    """Market news response schema"""
    id: str
    title: str
    content: str
    source: str
    symbols: List[str]
    published_at: datetime
    sentiment: Optional[str] = None
    impact_score: Optional[float] = None

class OptionChainRequest(BaseModel):
    """Option chain request schema"""
    symbol: str
    expiration_date: Optional[datetime] = None
    option_type: Optional[str] = None  # call, put, or both
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()

class OptionChainResponse(BaseModel):
    """Option chain response schema"""
    underlying_symbol: str
    expiration_date: datetime
    strike_price: float
    option_type: str
    bid: Optional[float] = None
    ask: Optional[float] = None
    last_price: Optional[float] = None
    volume: Optional[int] = None
    open_interest: Optional[int] = None
    implied_volatility: Optional[float] = None
    greeks: Optional[Dict[str, float]] = None
    timestamp: datetime

class MarketCalendarResponse(BaseModel):
    """Market calendar response schema"""
    date: datetime
    market: str
    is_open: bool
    session_start: Optional[datetime] = None
    session_end: Optional[datetime] = None
    early_close: Optional[datetime] = None
    holiday_name: Optional[str] = None

class WatchlistRequest(BaseModel):
    """Watchlist request schema"""
    user_id: str
    name: str
    symbols: List[str]
    is_public: bool = False
    
    @validator('symbols')
    def validate_symbols(cls, v):
        return [symbol.upper().strip() for symbol in v]
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('name cannot be empty')
        return v.strip()

class WatchlistResponse(BaseModel):
    """Watchlist response schema"""
    id: str
    user_id: str
    name: str
    symbols: List[str]
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class MarketScannerRequest(BaseModel):
    """Market scanner request schema"""
    criteria: Dict[str, Any]
    limit: Optional[int] = 50
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 500:
            raise ValueError('limit must be between 1 and 500')
        return v

class MarketScannerResponse(BaseModel):
    """Market scanner response schema"""
    symbols: List[str]
    results: List[Dict[str, Any]]
    total_matches: int
    scan_timestamp: datetime

class VolumeAnalysisResponse(BaseModel):
    """Volume analysis response schema"""
    symbol: str
    current_volume: int
    average_volume: float
    volume_ratio: float
    unusual_volume: bool
    timestamp: datetime

class PriceAlertWebSocketMessage(BaseModel):
    """WebSocket message for price alerts"""
    type: str = "price_alert"
    symbol: str
    current_price: float
    alert_price: float
    condition: str
    message: str
    timestamp: str

class MarketDataWebSocketMessage(BaseModel):
    """WebSocket message for market data updates"""
    type: str = "market_data"
    symbol: str
    price: float
    volume: int
    change: float
    change_percent: float
    timestamp: str