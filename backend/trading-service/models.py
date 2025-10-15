"""
Trading Service Models - Casa de Valores Information System
Database models for trading operations
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum as SQLEnum, Integer, DECIMAL
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class OrderType(enum.Enum):
    """Order type enumeration"""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class OrderSide(enum.Enum):
    """Order side enumeration"""
    BUY = "buy"
    SELL = "sell"

class OrderStatus(enum.Enum):
    """Order status enumeration"""
    PENDING = "pending"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"

class Order(Base):
    """Order model"""
    __tablename__ = "orders"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=True)  # Null for market orders
    stop_price = Column(DECIMAL(10, 2), nullable=True)  # For stop orders
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    filled_quantity = Column(Integer, default=0)
    average_fill_price = Column(DECIMAL(10, 2), nullable=True)
    time_in_force = Column(String(10), default="DAY")  # DAY, GTC, IOC, FOK
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Order(id={self.id}, symbol={self.symbol}, side={self.side}, quantity={self.quantity})>"

class Trade(Base):
    """Trade execution model"""
    __tablename__ = "trades"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(CHAR(36), nullable=False, index=True)
    user_id = Column(CHAR(36), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    side = Column(SQLEnum(OrderSide), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    commission = Column(DECIMAL(8, 2), nullable=False, default=0)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    settlement_date = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Trade(id={self.id}, symbol={self.symbol}, quantity={self.quantity}, price={self.price})>"

class Position(Base):
    """User position model"""
    __tablename__ = "positions"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    average_cost = Column(DECIMAL(10, 2), nullable=False, default=0)
    market_value = Column(DECIMAL(12, 2), nullable=False, default=0)
    unrealized_pnl = Column(DECIMAL(12, 2), nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Position(user_id={self.user_id}, symbol={self.symbol}, quantity={self.quantity})>"

class OrderBook(Base):
    """Order book model for market making"""
    __tablename__ = "order_book"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(10), nullable=False, index=True)
    side = Column(SQLEnum(OrderSide), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    order_count = Column(Integer, nullable=False, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<OrderBook(symbol={self.symbol}, side={self.side}, price={self.price})>"

class TradingSession(Base):
    """Trading session model"""
    __tablename__ = "trading_sessions"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    session_start = Column(DateTime, default=datetime.utcnow, nullable=False)
    session_end = Column(DateTime, nullable=True)
    total_trades = Column(Integer, default=0)
    total_volume = Column(DECIMAL(15, 2), default=0)
    pnl = Column(DECIMAL(12, 2), default=0)
    
    def __repr__(self):
        return f"<TradingSession(user_id={self.user_id}, trades={self.total_trades})>"