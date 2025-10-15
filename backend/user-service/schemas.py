"""
User Service Schemas - Casa de Valores Information System
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from models import UserRole

class UserBase(BaseModel):
    """Base user schema"""
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.INVESTOR

class UserCreate(UserBase):
    """Schema for user creation"""
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.isalnum():
            raise ValueError('Username must contain only alphanumeric characters')
        return v

class UserUpdate(BaseModel):
    """Schema for user updates"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    """Schema for user response"""
    id: str
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str
    password: str
    mfa_code: Optional[str] = None

class LoginResponse(BaseModel):
    """Schema for login response"""
    access_token: str
    token_type: str
    requires_mfa: bool = False
    user: UserResponse

class MFASetupResponse(BaseModel):
    """Schema for MFA setup response"""
    secret: str
    qr_code: str
    backup_codes: List[str]

class MFAVerifyRequest(BaseModel):
    """Schema for MFA verification request"""
    code: str

class ChangePasswordRequest(BaseModel):
    """Schema for password change request"""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class TokenData(BaseModel):
    """Schema for token data"""
    sub: str
    username: str
    role: str
    email: str
    exp: datetime

class AuditLogResponse(BaseModel):
    """Schema for audit log response"""
    id: str
    user_id: str
    action: str
    details: Optional[str] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    
    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    """Schema for permission response"""
    id: str
    name: str
    description: Optional[str] = None
    resource: str
    action: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserPermissionResponse(BaseModel):
    """Schema for user permission response"""
    id: str
    user_id: str
    permission: PermissionResponse
    granted_at: datetime
    granted_by: str
    
    class Config:
        from_attributes = True