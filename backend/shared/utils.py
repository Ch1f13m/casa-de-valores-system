"""
Shared utilities for Casa de Valores microservices
"""

import hashlib
import secrets
import string
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from decimal import Decimal, ROUND_HALF_UP
import re
import uuid
import logging

logger = logging.getLogger(__name__)

# Security utilities
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_random_string(length: int = 32) -> str:
    """Generate a random string"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_uuid() -> str:
    """Generate a UUID string"""
    return str(uuid.uuid4())

def create_access_token(data: Dict[str, Any], secret_key: str, algorithm: str = "HS256", expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)

def verify_token(token: str, secret_key: str, algorithm: str = "HS256") -> Optional[Dict[str, Any]]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.JWTError as e:
        logger.warning(f"JWT error: {e}")
        return None

# Validation utilities
def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "strength": "strong" if len(errors) == 0 else "weak"
    }

def validate_symbol(symbol: str) -> bool:
    """Validate stock symbol format"""
    pattern = r'^[A-Z]{1,5}$'
    return re.match(pattern, symbol.upper()) is not None

# Financial utilities
def calculate_commission(quantity: int, price: Decimal, rate: Decimal = Decimal('0.01'), min_commission: Decimal = Decimal('1.00')) -> Decimal:
    """Calculate trading commission"""
    commission = quantity * rate
    return max(commission, min_commission)

def round_currency(amount: Decimal, places: int = 2) -> Decimal:
    """Round currency amount to specified decimal places"""
    return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def calculate_percentage_change(old_value: Decimal, new_value: Decimal) -> Decimal:
    """Calculate percentage change between two values"""
    if old_value == 0:
        return Decimal('0')
    return ((new_value - old_value) / old_value) * 100

def calculate_compound_return(returns: List[Decimal]) -> Decimal:
    """Calculate compound return from a list of returns"""
    if not returns:
        return Decimal('0')
    
    compound = Decimal('1')
    for ret in returns:
        compound *= (1 + ret / 100)
    
    return (compound - 1) * 100

# Data utilities
def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize string input"""
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', text.strip())
    
    if max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def format_currency(amount: Decimal, currency: str = "USD") -> str:
    """Format currency amount for display"""
    if currency == "USD":
        return f"${amount:,.2f}"
    elif currency == "EUR":
        return f"€{amount:,.2f}"
    elif currency == "GBP":
        return f"£{amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"

def parse_date_range(date_str: str) -> Optional[tuple]:
    """Parse date range string (e.g., '2023-01-01,2023-12-31')"""
    try:
        if ',' in date_str:
            start_str, end_str = date_str.split(',')
            start_date = datetime.strptime(start_str.strip(), '%Y-%m-%d')
            end_date = datetime.strptime(end_str.strip(), '%Y-%m-%d')
            return (start_date, end_date)
    except ValueError:
        pass
    return None

# Logging utilities
def setup_logging(service_name: str, log_level: str = "INFO") -> logging.Logger:
    """Setup logging for a service"""
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            f'%(asctime)s - {service_name} - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

# Cache utilities
def generate_cache_key(*args) -> str:
    """Generate cache key from arguments"""
    key_parts = [str(arg) for arg in args]
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

def serialize_for_cache(data: Any) -> str:
    """Serialize data for caching"""
    import json
    from decimal import Decimal
    
    def decimal_serializer(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    return json.dumps(data, default=decimal_serializer)

def deserialize_from_cache(data: str) -> Any:
    """Deserialize data from cache"""
    import json
    return json.loads(data)

# Error handling utilities
class CasaValoresException(Exception):
    """Base exception for Casa de Valores system"""
    def __init__(self, message: str, error_code: str = "GENERAL_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(CasaValoresException):
    """Validation error"""
    def __init__(self, message: str, field: str = None, details: Optional[Dict] = None):
        super().__init__(message, "VALIDATION_ERROR", details)
        self.field = field

class AuthenticationError(CasaValoresException):
    """Authentication error"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict] = None):
        super().__init__(message, "AUTHENTICATION_ERROR", details)

class AuthorizationError(CasaValoresException):
    """Authorization error"""
    def __init__(self, message: str = "Access denied", details: Optional[Dict] = None):
        super().__init__(message, "AUTHORIZATION_ERROR", details)

class BusinessLogicError(CasaValoresException):
    """Business logic error"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "BUSINESS_LOGIC_ERROR", details)

class ExternalServiceError(CasaValoresException):
    """External service error"""
    def __init__(self, message: str, service: str, details: Optional[Dict] = None):
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)
        self.service = service