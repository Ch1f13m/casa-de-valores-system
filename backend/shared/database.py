"""
Shared database configuration and utilities for Casa de Valores microservices
"""
import os
from typing import AsyncGenerator
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from contextlib import asynccontextmanager

# Database URLs from environment
DATABASE_URL = os.getenv("DATABASE_URL", "mysql://app_user:app_password@localhost:3306/casa_valores")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:adminpassword@localhost:27017/casa_valores_docs?authSource=admin")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# SQLAlchemy setup for MySQL
# Convert mysql:// to mysql+aiomysql:// for async support
ASYNC_DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+aiomysql://")

# Create async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create sync engine for migrations and initial setup
sync_engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# MongoDB client
mongodb_client = AsyncIOMotorClient(MONGODB_URL)
mongodb_database = mongodb_client.get_database()

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class DatabaseManager:
    """Database manager for handling connections and sessions"""
    
    def __init__(self):
        self.async_engine = async_engine
        self.mongodb_client = mongodb_client
        self.redis_client = redis_client
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async database session"""
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def get_mongodb_collection(self, collection_name: str):
        """Get MongoDB collection"""
        return mongodb_database[collection_name]
    
    async def get_redis_client(self):
        """Get Redis client"""
        return self.redis_client
    
    async def close_connections(self):
        """Close all database connections"""
        await self.async_engine.dispose()
        self.mongodb_client.close()
        await self.redis_client.close()

# Global database manager instance
db_manager = DatabaseManager()

# Dependency for FastAPI
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session in FastAPI endpoints"""
    async with db_manager.get_async_session() as session:
        yield session

async def get_mongodb_collection(collection_name: str):
    """Dependency to get MongoDB collection in FastAPI endpoints"""
    return await db_manager.get_mongodb_collection(collection_name)

async def get_redis_client():
    """Dependency to get Redis client in FastAPI endpoints"""
    return await db_manager.get_redis_client()

# Health check functions
async def check_mysql_health() -> bool:
    """Check MySQL database health"""
    try:
        async with db_manager.get_async_session() as session:
            await session.execute("SELECT 1")
            return True
    except Exception:
        return False

async def check_mongodb_health() -> bool:
    """Check MongoDB health"""
    try:
        await mongodb_client.admin.command('ping')
        return True
    except Exception:
        return False

async def check_redis_health() -> bool:
    """Check Redis health"""
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False