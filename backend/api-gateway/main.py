"""
API Gateway - Casa de Valores Information System
Main entry point for the API Gateway service
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import httpx
import jwt
import redis
import time
import logging
from typing import Dict, Any, Optional
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CORS_ORIGINS = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:4200").split(",")

# Service URLs
SERVICES = {
    "user": os.getenv("USER_SERVICE_URL", "http://user-service:8000"),
    "trading": os.getenv("TRADING_SERVICE_URL", "http://trading-service:8000"),
    "portfolio": os.getenv("PORTFOLIO_SERVICE_URL", "http://portfolio-service:8000"),
    "market-data": os.getenv("MARKET_DATA_SERVICE_URL", "http://market-data-service:8000"),
    "risk": os.getenv("RISK_SERVICE_URL", "http://risk-service:8000"),
    "compliance": os.getenv("COMPLIANCE_SERVICE_URL", "http://compliance-service:8000"),
}

# Global variables
redis_client = None
http_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, http_client
    
    # Startup
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("API Gateway started successfully")
    
    yield
    
    # Shutdown
    if http_client:
        await http_client.aclose()
    if redis_client:
        redis_client.close()
    logger.info("API Gateway shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Casa de Valores API Gateway",
    description="API Gateway for Casa de Valores Information System",
    version="1.0.0",
    lifespan=lifespan
)

# Security
security = HTTPBearer()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure properly in production
)

# Rate limiting middleware
class RateLimitMiddleware:
    def __init__(self, calls: int = 100, period: int = 60):
        self.calls = calls
        self.period = period

    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            current = redis_client.get(key)
            if current is None:
                redis_client.setex(key, self.period, 1)
            else:
                if int(current) >= self.calls:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded"}
                    )
                redis_client.incr(key)
        except Exception as e:
            logger.warning(f"Rate limiting error: {e}")
        
        response = await call_next(request)
        return response

# Add rate limiting
app.middleware("http")(RateLimitMiddleware())

# Authentication functions
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        
        # Check if token is blacklisted
        if redis_client.get(f"blacklist:{credentials.credentials}"):
            raise HTTPException(status_code=401, detail="Token has been revoked")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token_data: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """Get current user from token"""
    return token_data

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": list(SERVICES.keys())
    }

# Service routing
async def route_request(
    request: Request,
    service: str,
    path: str,
    user: Optional[Dict[str, Any]] = None
):
    """Route request to appropriate microservice"""
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_url = SERVICES[service]
    target_url = f"{service_url}{path}"
    
    # Prepare headers
    headers = dict(request.headers)
    if user:
        headers["X-User-ID"] = str(user.get("sub"))
        headers["X-User-Role"] = user.get("role", "")
    
    # Remove host header to avoid conflicts
    headers.pop("host", None)
    
    try:
        # Forward request to microservice
        if request.method == "GET":
            response = await http_client.get(
                target_url,
                headers=headers,
                params=request.query_params
            )
        elif request.method == "POST":
            body = await request.body()
            response = await http_client.post(
                target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
        elif request.method == "PUT":
            body = await request.body()
            response = await http_client.put(
                target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
        elif request.method == "DELETE":
            response = await http_client.delete(
                target_url,
                headers=headers,
                params=request.query_params
            )
        else:
            raise HTTPException(status_code=405, detail="Method not allowed")
        
        return JSONResponse(
            status_code=response.status_code,
            content=response.json() if response.content else None,
            headers=dict(response.headers)
        )
    
    except httpx.RequestError as e:
        logger.error(f"Service request failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Public routes (no authentication required)
@app.api_route("/api/v1/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_routes(request: Request, path: str):
    """Authentication routes - no auth required"""
    return await route_request(request, "user", f"/api/v1/auth/{path}")

@app.api_route("/api/v1/market-data/public/{path:path}", methods=["GET"])
async def public_market_data(request: Request, path: str):
    """Public market data routes - no auth required"""
    return await route_request(request, "market-data", f"/api/v1/public/{path}")

# Protected routes (authentication required)
@app.api_route("/api/v1/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def user_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """User management routes"""
    return await route_request(request, "user", f"/api/v1/users/{path}", user)

@app.api_route("/api/v1/trading/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def trading_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Trading service routes"""
    return await route_request(request, "trading", f"/api/v1/trading/{path}", user)

@app.api_route("/api/v1/portfolio/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def portfolio_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Portfolio service routes"""
    return await route_request(request, "portfolio", f"/api/v1/portfolio/{path}", user)

@app.api_route("/api/v1/market-data/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def market_data_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Market data service routes"""
    return await route_request(request, "market-data", f"/api/v1/market-data/{path}", user)

@app.api_route("/api/v1/risk/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def risk_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Risk management service routes"""
    return await route_request(request, "risk", f"/api/v1/risk/{path}", user)

@app.api_route("/api/v1/compliance/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def compliance_routes(request: Request, path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Compliance service routes"""
    return await route_request(request, "compliance", f"/api/v1/compliance/{path}", user)

# WebSocket proxy for real-time data
@app.websocket("/ws/{service}/{path:path}")
async def websocket_proxy(websocket, service: str, path: str):
    """WebSocket proxy for real-time communications"""
    # This would require more complex implementation for WebSocket proxying
    # For now, we'll implement direct WebSocket endpoints in each service
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )