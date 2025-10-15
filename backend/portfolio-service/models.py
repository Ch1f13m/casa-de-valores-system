"""
Portfolio Service Models - Casa de Valores Information System
Database models for portfolio management
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, DECIMAL, Date
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date
import uuid

Base = declarative_base()

class Portfolio(Base):
    """Portfolio model"""
    __tablename__ = "portfolios"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    total_value = Column(DECIMAL(15, 2), nullable=False, default=0)
    cash_balance = Column(DECIMAL(15, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Portfolio(id={self.id}, name={self.name}, user_id={self.user_id})>"

class Holding(Base):
    """Portfolio holding model"""
    __tablename__ = "holdings"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(CHAR(36), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    quantity = Column(DECIMAL(15, 6), nullable=False, default=0)
    average_cost = Column(DECIMAL(10, 4), nullable=False, default=0)
    current_price = Column(DECIMAL(10, 4), nullable=False, default=0)
    market_value = Column(DECIMAL(15, 2), nullable=False, default=0)
    unrealized_pnl = Column(DECIMAL(15, 2), nullable=False, default=0)
    sector = Column(String(50), nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Holding(portfolio_id={self.portfolio_id}, symbol={self.symbol}, quantity={self.quantity})>"

class PerformanceMetric(Base):
    """Portfolio performance metrics model"""
    __tablename__ = "performance_metrics"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(CHAR(36), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    total_value = Column(DECIMAL(15, 2), nullable=False)
    cash_balance = Column(DECIMAL(15, 2), nullable=False)
    invested_amount = Column(DECIMAL(15, 2), nullable=False)
    return_pct = Column(DECIMAL(8, 4), nullable=False, default=0)
    benchmark_return_pct = Column(DECIMAL(8, 4), nullable=True)
    volatility = Column(DECIMAL(8, 4), nullable=True)
    sharpe_ratio = Column(DECIMAL(8, 4), nullable=True)
    max_drawdown = Column(DECIMAL(8, 4), nullable=True)
    
    def __repr__(self):
        return f"<PerformanceMetric(portfolio_id={self.portfolio_id}, date={self.date})>"

class AssetAllocation(Base):
    """Asset allocation model"""
    __tablename__ = "asset_allocations"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(CHAR(36), nullable=False, index=True)
    asset_class = Column(String(50), nullable=False)  # stocks, bonds, cash, etc.
    sector = Column(String(50), nullable=True)
    target_percentage = Column(DECIMAL(5, 2), nullable=False)
    current_percentage = Column(DECIMAL(5, 2), nullable=False, default=0)
    target_value = Column(DECIMAL(15, 2), nullable=False)
    current_value = Column(DECIMAL(15, 2), nullable=False, default=0)
    deviation = Column(DECIMAL(5, 2), nullable=False, default=0)
    last_rebalanced = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AssetAllocation(portfolio_id={self.portfolio_id}, asset_class={self.asset_class})>"

class Watchlist(Base):
    """User watchlist model"""
    __tablename__ = "watchlists"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Watchlist(id={self.id}, name={self.name}, user_id={self.user_id})>"

class WatchlistItem(Base):
    """Watchlist item model"""
    __tablename__ = "watchlist_items"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(CHAR(36), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<WatchlistItem(watchlist_id={self.watchlist_id}, symbol={self.symbol})>"

class PortfolioSnapshot(Base):
    """Portfolio snapshot for historical tracking"""
    __tablename__ = "portfolio_snapshots"
    
    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(CHAR(36), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    total_value = Column(DECIMAL(15, 2), nullable=False)
    cash_balance = Column(DECIMAL(15, 2), nullable=False)
    holdings_data = Column(Text, nullable=False)  # JSON string of holdings
    performance_data = Column(Text, nullable=True)  # JSON string of performance metrics
    
    def __repr__(self):
        return f"<PortfolioSnapshot(portfolio_id={self.portfolio_id}, date={self.snapshot_date})>"