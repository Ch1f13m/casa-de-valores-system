"""
Shared configuration for Casa de Valores microservices
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    PROJECT_NAME: str = "Casa de Valores Information System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-minimum-32-characters"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    ENCRYPTION_KEY: str = "your-32-character-encryption-key-here"
    
    # Database
    DATABASE_URL: str = "mysql://app_user:app_password@localhost:3306/casa_valores"
    MONGODB_URL: str = "mongodb://admin:adminpassword@localhost:27017/casa_valores_docs?authSource=admin"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Message Queue
    RABBITMQ_URL: str = "amqp://admin:adminpassword@localhost:5672/"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "https://localhost:4200",
        "http://localhost",
        "https://localhost"
    ]
    
    # External Services
    MARKET_DATA_API_KEY: str = "your-market-data-api-key"
    MARKET_DATA_BASE_URL: str = "https://api.marketdata.com/v1"
    
    # Email Configuration
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_BURST: int = 20
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_FOLDER: str = "uploads/"
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Service URLs (for inter-service communication)
    USER_SERVICE_URL: str = "http://user-service:8000"
    TRADING_SERVICE_URL: str = "http://trading-service:8000"
    PORTFOLIO_SERVICE_URL: str = "http://portfolio-service:8000"
    MARKET_DATA_SERVICE_URL: str = "http://market-data-service:8000"
    RISK_SERVICE_URL: str = "http://risk-service:8000"
    COMPLIANCE_SERVICE_URL: str = "http://compliance-service:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Service-specific settings
class UserServiceSettings(Settings):
    """User service specific settings"""
    SERVICE_NAME: str = "user-service"
    SERVICE_PORT: int = 8001
    REDIS_DB: int = 1

class TradingServiceSettings(Settings):
    """Trading service specific settings"""
    SERVICE_NAME: str = "trading-service"
    SERVICE_PORT: int = 8002
    REDIS_DB: int = 2
    
    # Trading specific
    DEFAULT_COMMISSION_RATE: float = 0.01
    MIN_COMMISSION: float = 1.00
    MAX_POSITION_SIZE: int = 10000

class MarketDataServiceSettings(Settings):
    """Market data service specific settings"""
    SERVICE_NAME: str = "market-data-service"
    SERVICE_PORT: int = 8003
    REDIS_DB: int = 3
    
    # Market data specific
    DATA_UPDATE_INTERVAL: int = 1  # seconds
    HISTORICAL_DATA_RETENTION_DAYS: int = 365
    MAX_SYMBOLS_PER_SUBSCRIPTION: int = 50

class PortfolioServiceSettings(Settings):
    """Portfolio service specific settings"""
    SERVICE_NAME: str = "portfolio-service"
    SERVICE_PORT: int = 8004
    REDIS_DB: int = 4
    
    # Portfolio specific
    POSITION_UPDATE_INTERVAL: int = 30  # seconds
    MAX_PORTFOLIOS_PER_USER: int = 10

class RiskServiceSettings(Settings):
    """Risk service specific settings"""
    SERVICE_NAME: str = "risk-service"
    SERVICE_PORT: int = 8005
    REDIS_DB: int = 5
    
    # Risk specific
    VAR_CONFIDENCE_LEVEL: float = 0.95
    RISK_CALCULATION_INTERVAL: int = 60  # seconds
    MAX_PORTFOLIO_CONCENTRATION: float = 0.20  # 20%

class ComplianceServiceSettings(Settings):
    """Compliance service specific settings"""
    SERVICE_NAME: str = "compliance-service"
    SERVICE_PORT: int = 8006
    REDIS_DB: int = 6
    
    # Compliance specific
    AUDIT_LOG_RETENTION_DAYS: int = 2555  # 7 years
    SUSPICIOUS_ACTIVITY_THRESHOLD: float = 10000.00
    REPORT_GENERATION_SCHEDULE: str = "0 0 * * *"  # Daily at midnight