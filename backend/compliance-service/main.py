"""
Compliance Service - Casa de Valores Information System
Handles compliance monitoring and regulatory requirements
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Configuration
CORS_ORIGINS = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:4200").split(",")

# Create FastAPI application
app = FastAPI(
    title="Compliance Service",
    description="Casa de Valores Compliance Management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    """Root endpoint"""
    return {"message": "Compliance Service is running", "service": "compliance"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "compliance"}

@app.get("/compliance/rules")
async def get_compliance_rules():
    """Get compliance rules"""
    return {"rules": [], "message": "Compliance rules endpoint"}

@app.get("/compliance/violations")
async def get_violations():
    """Get compliance violations"""
    return {"violations": [], "message": "Compliance violations endpoint"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)