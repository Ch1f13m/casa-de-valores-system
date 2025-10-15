"""
Market Data Service Models - Casa de Valores Information System
Data models for market data storage and processing
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
import uuid

class MarketData(BaseModel):
    """Real-time market data model"""
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
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class HistoricalData(BaseModel):
    """Historical market data model (OHLCV)"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TechnicalIndicator(BaseModel):
    """Technical indicator calculation result"""
    symbol: str
    indicator_type: str  # sma, ema, rsi, macd, etc.
    period: int
    values: list
    timestamps: list
    calculated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MarketAlert(BaseModel):
    """Market alert model"""
    id: str = None
    user_id: str
    symbol: str
    condition: str  # above, below, equals
    target_value: float
    message: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    triggered_at: Optional[datetime] = None
    
    def __init__(self, **data):
        if 'id' not in data or data['id'] is None:
            data['id'] = str(uuid.uuid4())
        super().__init__(**data)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MarketSubscription(BaseModel):
    """Market data subscription model"""
    user_id: str
    symbols: list
    subscription_type: str  # real_time, alerts, indicators
    created_at: datetime
    is_active: bool = True
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MarketNews(BaseModel):
    """Market news model"""
    id: str = None
    title: str
    content: str
    source: str
    symbols: list  # Related symbols
    published_at: datetime
    sentiment: Optional[str] = None  # positive, negative, neutral
    impact_score: Optional[float] = None  # 0-1 scale
    
    def __init__(self, **data):
        if 'id' not in data or data['id'] is None:
            data['id'] = str(uuid.uuid4())
        super().__init__(**data)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MarketIndex(BaseModel):
    """Market index model"""
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    constituents: list  # List of constituent symbols
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TradingSession(BaseModel):
    """Trading session information"""
    market: str  # NYSE, NASDAQ, etc.
    session_type: str  # pre_market, regular, after_hours
    start_time: datetime
    end_time: datetime
    is_active: bool
    timezone: str = "America/New_York"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MarketHoliday(BaseModel):
    """Market holiday model"""
    date: datetime
    name: str
    market: str
    is_partial_day: bool = False
    early_close_time: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OptionChain(BaseModel):
    """Options chain data model"""
    underlying_symbol: str
    expiration_date: datetime
    strike_price: float
    option_type: str  # call, put
    bid: Optional[float] = None
    ask: Optional[float] = None
    last_price: Optional[float] = None
    volume: Optional[int] = None
    open_interest: Optional[int] = None
    implied_volatility: Optional[float] = None
    delta: Optional[float] = None
    gamma: Optional[float] = None
    theta: Optional[float] = None
    vega: Optional[float] = None
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class CorporateAction(BaseModel):
    """Corporate action model"""
    symbol: str
    action_type: str  # dividend, split, merger, spinoff
    announcement_date: datetime
    ex_date: datetime
    record_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    details: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }