"""
Trading Service Schemas - Casa de Valores Information System
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import OrderType, OrderSide, OrderStatus

class OrderCreateRequest(BaseModel):
    """Schema for creating a new order"""
    symbol: str
    order_type: OrderType
    side: OrderSide
    quantity: int
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: Optional[str] = "DAY"
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('price')
    def validate_price(cls, v, values):
        if v is not None and v <= 0:
            raise ValueError('Price must be positive')
        
        # Require price for limit orders
        if values.get('order_type') == OrderType.LIMIT and v is None:
            raise ValueError('Limit orders require a price')
        
        return v

class OrderUpdateRequest(BaseModel):
    """Schema for updating an order"""
    quantity: Optional[int] = None
    price: Optional[float] = None
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be positive')
        return v

class OrderResponse(BaseModel):
    """Schema for order response"""
    id: str
    user_id: str
    symbol: str
    order_type: OrderType
    side: OrderSide
    quantity: int
    price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    status: OrderStatus
    filled_quantity: int
    average_fill_price: Optional[Decimal] = None
    time_in_force: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v else None
        }

class TradeResponse(BaseModel):
    """Schema for trade response"""
    id: str
    order_id: str
    user_id: str
    symbol: str
    side: OrderSide
    quantity: int
    price: Decimal
    commission: Decimal
    executed_at: datetime
    settlement_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class PositionResponse(BaseModel):
    """Schema for position response"""
    id: str
    user_id: str
    symbol: str
    quantity: int
    average_cost: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class OrderBookEntry(BaseModel):
    """Schema for order book entry"""
    price: float
    quantity: int
    order_count: int

class OrderBookResponse(BaseModel):
    """Schema for order book response"""
    symbol: str
    bids: List[OrderBookEntry]
    asks: List[OrderBookEntry]
    timestamp: datetime

class TradingStatsResponse(BaseModel):
    """Schema for trading statistics response"""
    total_trades: int
    total_volume: float
    total_commission: float
    buy_trades: int
    sell_trades: int
    total_position_value: float
    total_unrealized_pnl: float
    period_days: int

class MarketOrderRequest(BaseModel):
    """Schema for market order request"""
    symbol: str
    side: OrderSide
    quantity: int
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v

class LimitOrderRequest(BaseModel):
    """Schema for limit order request"""
    symbol: str
    side: OrderSide
    quantity: int
    price: float
    time_in_force: Optional[str] = "DAY"
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v

class StopOrderRequest(BaseModel):
    """Schema for stop order request"""
    symbol: str
    side: OrderSide
    quantity: int
    stop_price: float
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('stop_price')
    def validate_stop_price(cls, v):
        if v <= 0:
            raise ValueError('Stop price must be positive')
        return v

class PortfolioSummaryResponse(BaseModel):
    """Schema for portfolio summary response"""
    total_value: float
    cash_balance: float
    positions_value: float
    total_pnl: float
    day_pnl: float
    positions_count: int

class RiskMetricsResponse(BaseModel):
    """Schema for risk metrics response"""
    buying_power: float
    margin_used: float
    margin_available: float
    day_trading_buying_power: float
    maintenance_excess: float