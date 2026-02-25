from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Form, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError, DuplicateKeyError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
import hashlib
import urllib.parse
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import traceback
import re
import base64
from pathlib import Path

# ==================== LOGO CONFIGURATION ====================
# Path to logo
LOGO_PATH = Path(__file__).parent / "assets" / "cube.png"

# Read and encode logo as base64 for emails
def get_logo_base64():
    try:
        with open(LOGO_PATH, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string
    except Exception as e:
        logger.error(f"❌ Failed to load logo: {e}")
        return None

LOGO_BASE64 = get_logo_base64()

# ==================== CONFIGURE LOGGING FIRST ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== CONFIGURATION WITH VALIDATION ====================
# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
if not MONGO_URL:
    logger.error("❌ MONGO_URL environment variable is not set")
    raise ValueError("MONGO_URL environment variable is not set")

DB_NAME = os.environ.get('DB_NAME')
if not DB_NAME:
    logger.error("❌ DB_NAME environment variable is not set")
    raise ValueError("DB_NAME environment variable is not set")

try:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    logger.info(f"✅ Connected to MongoDB database: {DB_NAME}")
except Exception as e:
    logger.error(f"❌ Failed to connect to MongoDB: {e}")
    raise

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not SECRET_KEY:
    SECRET_KEY = 'your-secret-key-change-in-production'
    logger.warning("⚠️ JWT_SECRET_KEY not set, using default (change in production)")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ==================== PAYFAST CONFIGURATION - LIVE MODE ====================
PAYFAST_MERCHANT_ID = os.environ.get('PAYFAST_MERCHANT_ID')
PAYFAST_MERCHANT_KEY = os.environ.get('PAYFAST_MERCHANT_KEY')
PAYFAST_PASSPHRASE = os.environ.get('PAYFAST_PASSPHRASE')
PAYFAST_URL = os.environ.get('PAYFAST_URL', 'https://www.payfast.co.za/eng/process')  # LIVE URL
PAYFAST_RETURN_URL = os.environ.get('PAYFAST_RETURN_URL', 'http://localhost:5173/payment-success')
PAYFAST_CANCEL_URL = os.environ.get('PAYFAST_CANCEL_URL', 'http://localhost:5173/payment-failed')
PAYFAST_NOTIFY_URL = os.environ.get('PAYFAST_NOTIFY_URL')

# Validate PayFast credentials
if not PAYFAST_MERCHANT_ID:
    logger.error("❌ PAYFAST_MERCHANT_ID not set in .env")
    raise ValueError("PAYFAST_MERCHANT_ID is required")

if not PAYFAST_MERCHANT_KEY:
    logger.error("❌ PAYFAST_MERCHANT_KEY not set in .env")
    raise ValueError("PAYFAST_MERCHANT_KEY is required")

if not PAYFAST_PASSPHRASE:
    logger.error("❌ PAYFAST_PASSPHRASE not set in .env")
    raise ValueError("PAYFAST_PASSPHRASE is required")

if not PAYFAST_NOTIFY_URL:
    logger.error("❌ PAYFAST_NOTIFY_URL not set in .env")
    raise ValueError("PAYFAST_NOTIFY_URL is required (use ngrok URL)")

# Clean passphrase of any whitespace
PAYFAST_PASSPHRASE = PAYFAST_PASSPHRASE.strip()

logger.info(f"✅ PayFast LIVE configured for Merchant ID: {PAYFAST_MERCHANT_ID}")
logger.info(f"✅ PayFast Notify URL: {PAYFAST_NOTIFY_URL}")
logger.info(f"✅ PayFast Passphrase length: {len(PAYFAST_PASSPHRASE)}")

# ==================== RESEND EMAIL CONFIGURATION ====================
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
RESEND_API_URL = "https://api.resend.com/emails"

# Email Configuration (SMTP fallback)
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@tutorhub.com')
EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'false').lower() == 'true'

# Override EMAIL_ENABLED if Resend is configured
if RESEND_API_KEY:
    EMAIL_ENABLED = True
    logger.info("✅ Resend API configured for primary email delivery")
else:
    logger.warning("⚠️ RESEND_API_KEY not set - will use SMTP fallback only")

# WhatsApp Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
WHATSAPP_ENABLED = os.environ.get('WHATSAPP_ENABLED', 'false').lower() == 'true'

# Frontend URL
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# ==================== CORS CONFIGURATION - FROM ENV ====================
CORS_ORIGINS_STR = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(',') if origin.strip()]
logger.info(f"✅ CORS origins configured: {CORS_ORIGINS}")

# ==================== EMAIL STYLES & TEMPLATE (MOVED TO TOP) ====================
EMAIL_STYLES = {
    'primary': '#4F46E5',
    'primary_gradient': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    'secondary': '#10B981',
    'success': '#10B981',
    'warning': '#F59E0B',
    'danger': '#EF4444',
    'dark': '#1F2937',
    'light': '#F9FAFB',
    'border': '#E5E7EB',
    'text': '#374151',
    'text_light': '#6B7280',
    'background': '#F3F4F6',
    'whatsapp': '#25D366',
    'whatsapp_bg': '#DCF8C6',
    'whatsapp_text': '#075E54'
}

def get_email_template(content_html: str, logo_html: str = "") -> str:
    """Get the base email template with content"""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CubeNotes</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: {EMAIL_STYLES['background']};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: {EMAIL_STYLES['background']};">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
                    {logo_html}
                    <tr>
                        <td style="padding: 40px;">
                            {content_html}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid {EMAIL_STYLES['border']}; text-align: center;">
                            <p style="margin: 0; color: {EMAIL_STYLES['text_light']}; font-size: 12px;">
                                © {datetime.now().year} CubeNotes. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

# ==================== CREATE APP FIRST ====================
app = FastAPI(
    title="Tutoring Booking API",
    description="API for booking tutoring sessions with PayFast payment integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ==================== CORS MIDDLEWARE ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ==================== SWAGGER/OPENAPI AUTHENTICATION FIX ====================
security = HTTPBearer(auto_error=False)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Tutoring Booking API",
        version="1.0.0",
        description="API for booking tutoring sessions with PayFast payment integration",
        routes=app.routes,
    )
    
    # Add Bearer Authentication to Swagger UI
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format: Bearer <token>"
        }
    }
    
    # Apply security globally to all endpoints
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# ==================== ROUTER ====================
api_router = APIRouter(prefix="/api")

# ==================== ENUMS ====================
class Subject(str, Enum):
    MATHS = "Maths"
    PHYSICAL_SCIENCES = "Physical Sciences"

class Grade(str, Enum):
    GRADE_10 = "10"
    GRADE_11 = "11"
    GRADE_12 = "12"

class SessionType(str, Enum):
    GROUP = "group"
    ONE_ON_ONE = "one_on_one"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# ==================== MODELS ====================
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    grade: Grade
    phone: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        phone = re.sub(r'\D', '', v)
        if len(phone) < 10 or len(phone) > 15:
            raise ValueError('Phone number must be between 10 and 15 digits')
        return phone

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    grade: Grade
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    hashed_password: str

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_type: SessionType
    subject: Subject
    date: str
    start_time: str
    duration_minutes: int = 90
    price: int
    max_students: int
    current_bookings: int = 0
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
    
    @field_validator('start_time')
    @classmethod
    def validate_time(cls, v: str) -> str:
        try:
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            raise ValueError('Time must be in HH:MM format')

class BookingCreate(BaseModel):
    session_id: str
    student_notes: Optional[str] = Field(None, max_length=500)

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    status: BookingStatus = BookingStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    student_notes: Optional[str] = None
    amount: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    amount: int
    status: PaymentStatus = PaymentStatus.PENDING
    payment_method: str = "payfast"
    pf_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_doc = await db.users.find_one(
            {"id": user_id},
            {"_id": 0, "hashed_password": 0}
        )
        
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return User(**user_doc)
        
    except PyMongoError as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# ==================== PAYFAST HELPERS - PAYFAST EXACT SPEC ====================
def generate_payfast_signature(data: dict, passphrase: str) -> str:
    """
    Generate PayFast signature EXACTLY as per PayFast specification.
    CRITICAL: Parameters must be in the EXACT order that PayFast expects!
    """
    try:
        # Define the EXACT parameter order PayFast expects (from their documentation)
        param_order = [
            'merchant_id',
            'merchant_key',
            'return_url',
            'cancel_url',
            'notify_url',
            'name_first',
            'name_last',
            'email_address',
            'cell_number',
            'm_payment_id',
            'amount',
            'item_name',
            'item_description',
            'custom_int1',
            'custom_int2',
            'custom_str1',
            'custom_str2',
            'email_confirmation',
            'confirmation_address',
            'payment_method'
        ]
        
        # Build string in EXACT order
        pf_param_string = ""
        for key in param_order:
            if key in data and data[key] is not None and str(data[key]).strip():
                # URL encode the value using quote_plus (spaces become +)
                encoded_value = urllib.parse.quote_plus(str(data[key]).strip())
                if pf_param_string:
                    pf_param_string += "&"
                pf_param_string += f"{key}={encoded_value}"
        
        # Add passphrase if it exists
        if passphrase and passphrase.strip():
            clean_passphrase = passphrase.strip()
            pf_param_string += f"&passphrase={urllib.parse.quote_plus(clean_passphrase)}"
            logger.debug(f"✅ Passphrase added to signature string")
        
        # DEBUG: Log the exact string being hashed
        logger.info(f"🔐 Signature string: {pf_param_string}")
        
        # Generate MD5 hash
        signature = hashlib.md5(pf_param_string.encode('utf-8')).hexdigest()
        
        logger.info(f"✅ Signature generated: {signature}")
        return signature
        
    except Exception as e:
        logger.error(f"❌ Error generating PayFast signature: {e}")
        logger.error(traceback.format_exc())
        return ""

# ==================== RESEND EMAIL HELPER ====================
async def send_email_via_resend(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = "",
    from_email: str = EMAIL_FROM
) -> bool:
    """
    Send email using Resend API
    """
    try:
        if not RESEND_API_KEY:
            logger.error("❌ RESEND_API_KEY not configured")
            return False
        
        # Prepare the payload
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content or "Please view this email in an HTML compatible client."
        }
        
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"📧 Sending via Resend to: {to_email}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                RESEND_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Resend email sent successfully: {result.get('id')}")
                return True
            else:
                logger.error(f"❌ Resend API error: {response.status_code} - {response.text}")
                return False
                
    except httpx.TimeoutException:
        logger.error("❌ Resend API timeout")
        return False
    except Exception as e:
        logger.error(f"❌ Resend email error: {e}")
        logger.error(traceback.format_exc())
        return False

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUp):
    try:
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_pw = hash_password(user_data.password)
        user = UserInDB(
            email=user_data.email,
            full_name=user_data.full_name,
            grade=user_data.grade,
            phone=user_data.phone,
            hashed_password=hashed_pw
        )
        
        user_dict = user.model_dump()
        user_dict['created_at'] = datetime.now(timezone.utc)
        
        await db.users.insert_one(user_dict)
        logger.info(f"✅ User created: {user.id}")
        
        token = create_access_token({"sub": user.id})
        
        return {
            "message": "User created successfully",
            "token": token,
            "user": User(**user.model_dump()).model_dump()
        }
        
    except PyMongoError as e:
        logger.error(f"Database error in signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    try:
        user_doc = await db.users.find_one({"email": credentials.email})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(credentials.password, user_doc['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if '_id' in user_doc:
            del user_doc['_id']
        
        user = UserInDB(**user_doc)
        token = create_access_token({"sub": user.id})
        
        return {
            "message": "Login successful",
            "token": token,
            "user": User(**user.model_dump()).model_dump()
        }
        
    except PyMongoError as e:
        logger.error(f"Database error in login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== SESSION ROUTES ====================
@api_router.get("/sessions")
async def get_sessions(
    session_type: Optional[SessionType] = None,
    subject: Optional[Subject] = None,
    available_only: bool = True
):
    try:
        query = {}
        if session_type:
            query["session_type"] = session_type.value
        if subject:
            query["subject"] = subject.value
        if available_only:
            query["available"] = True
        
        cursor = db.sessions.find(query, {"_id": 0})
        sessions = await cursor.to_list(100)
        sessions.sort(key=lambda x: (x['date'], x['start_time']))
        return sessions
        
    except PyMongoError as e:
        logger.error(f"Database error in get_sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        session = await db.sessions.find_one(
            {"id": session_id},
            {"_id": 0}
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return session
        
    except PyMongoError as e:
        logger.error(f"Database error in get_session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# ==================== BOOKING ROUTES - FIXED WITH AUTO PAYMENT ====================
@api_router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new booking and auto-initiate payment - REDIRECTS TO PAYMENT PAGE"""
    try:
        logger.info(f"📝 Creating booking for session: {booking_data.session_id}")
        logger.info(f"📝 User: {current_user.id}")
        
        # Get session - ALWAYS exclude _id
        session = await db.sessions.find_one(
            {"id": booking_data.session_id},
            {"_id": 0}
        )
        
        if not session:
            logger.error(f"❌ Session not found: {booking_data.session_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        logger.info(f"✅ Session found: {session['subject']} on {session['date']}")
        logger.info(f"📊 Available: {session.get('available')}")
        logger.info(f"📊 Bookings: {session['current_bookings']}/{session['max_students']}")
        
        # Check availability
        if session.get('available') is False:
            logger.error(f"❌ Session not available: {booking_data.session_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not available"
            )
        
        if session['current_bookings'] >= session['max_students']:
            logger.error(f"❌ Session fully booked: {booking_data.session_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is fully booked"
            )
        
        # Check for existing booking
        existing_booking = await db.bookings.find_one({
            "user_id": current_user.id,
            "session_id": booking_data.session_id,
            "status": {"$ne": "cancelled"}
        })
        
        if existing_booking:
            logger.error(f"❌ User already booked this session: {booking_data.session_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already booked this session"
            )
        
        # Create booking
        booking_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        booking = {
            "id": booking_id,
            "user_id": current_user.id,
            "session_id": booking_data.session_id,
            "status": "pending",
            "payment_status": "pending",
            "amount": session['price'],
            "student_notes": booking_data.student_notes,
            "created_at": now,
            "updated_at": now
        }
        
        # Insert booking
        result = await db.bookings.insert_one(booking)
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking"
            )
        
        logger.info(f"✅ Booking created: {booking_id}")
        
        # Update session count
        new_count = session['current_bookings'] + 1
        await db.sessions.update_one(
            {"id": booking_data.session_id},
            {
                "$set": {
                    "current_bookings": new_count,
                    "available": new_count < session['max_students']
                }
            }
        )
        
        logger.info(f"✅ Session updated - now {new_count}/{session['max_students']} bookings")
        
        # ===== AUTO-CREATE PAYMENT RECORD =====
        payment_id = str(uuid.uuid4())
        payment = {
            "id": payment_id,
            "booking_id": booking_id,
            "amount": booking['amount'],
            "status": "pending",
            "payment_method": "payfast",
            "created_at": now,
            "updated_at": now
        }
        
        await db.payments.insert_one(payment)
        logger.info(f"✅ Payment record created: {payment_id}")
        
        # ===== FIXED: Create a clean response dictionary =====
        response_data = {
            "success": True,
            "message": "Booking created successfully",
            "booking_id": booking_id,
            "booking": {
                "id": booking['id'],
                "user_id": booking['user_id'],
                "session_id": booking['session_id'],
                "status": booking['status'],
                "payment_status": booking['payment_status'],
                "amount": booking['amount'],
                "student_notes": booking['student_notes'],
                "created_at": booking['created_at'].isoformat() if isinstance(booking['created_at'], datetime) else booking['created_at'],
                "updated_at": booking['updated_at'].isoformat() if isinstance(booking['updated_at'], datetime) else booking['updated_at'],
                "session": {
                    "id": session['id'],
                    "subject": session['subject'],
                    "session_type": session['session_type'],
                    "date": session['date'],
                    "start_time": session['start_time'],
                    "duration_minutes": session['duration_minutes'],
                    "price": session['price']
                }
            },
            "payment": {
                "payment_id": payment_id,
                "status": "pending"
            },
            "redirect_to_payment": True,
            "redirect_url": f"/payment/{booking_id}"
        }
        
        return response_data
        
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error. Please try again."
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@api_router.get("/bookings/my-bookings")
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"📋 Fetching bookings for user: {current_user.id}")
        
        bookings = await db.bookings.find(
            {"user_id": current_user.id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        enriched = []
        for booking in bookings:
            session = await db.sessions.find_one(
                {"id": booking['session_id']},
                {"_id": 0}
            )
            payment = await db.payments.find_one(
                {"booking_id": booking['id']},
                {"_id": 0}
            )
            enriched.append({
                **booking, 
                "session": session,
                "payment": payment
            })
        
        logger.info(f"✅ Found {len(enriched)} bookings")
        return enriched
        
    except PyMongoError as e:
        logger.error(f"❌ Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.get("/bookings/{booking_id}")
async def get_booking_by_id(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        session = await db.sessions.find_one(
            {"id": booking['session_id']},
            {"_id": 0}
        )
        
        payment = await db.payments.find_one(
            {"booking_id": booking_id},
            {"_id": 0}
        )
        
        response = {**booking, "session": session}
        if payment:
            response["payment"] = payment
        
        return response
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        if booking['status'] == 'cancelled':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking already cancelled"
            )
        
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
        )
        
        session = await db.sessions.find_one(
            {"id": booking['session_id']},
            {"_id": 0}
        )
        
        if session:
            new_count = max(0, session['current_bookings'] - 1)
            await db.sessions.update_one(
                {"id": booking['session_id']},
                {
                    "$set": {
                        "current_bookings": new_count,
                        "available": new_count < session['max_students']
                    }
                }
            )
            logger.info(f"✅ Session updated: {booking['session_id']} now has {new_count} bookings")
        
        return {"message": "Booking cancelled successfully"}
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        if booking['status'] != 'cancelled':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only delete cancelled bookings"
            )
        
        session = await db.sessions.find_one(
            {"id": booking['session_id']},
            {"_id": 0}
        )
        
        await db.bookings.delete_one({"id": booking_id})
        logger.info(f"✅ Booking deleted: {booking_id}")
        
        await db.payments.delete_one({"booking_id": booking_id})
        
        if session:
            new_count = max(0, session['current_bookings'] - 1)
            await db.sessions.update_one(
                {"id": booking['session_id']},
                {
                    "$set": {
                        "current_bookings": new_count,
                        "available": new_count < session['max_students']
                    }
                }
            )
            logger.info(f"✅ Session updated: {booking['session_id']} now has {new_count} bookings")
        
        return {"message": "Booking deleted successfully"}
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# ==================== DASHBOARD STATS ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    try:
        total = await db.bookings.count_documents({"user_id": current_user.id})
        confirmed = await db.bookings.count_documents({
            "user_id": current_user.id,
            "status": "confirmed"
        })
        cancelled = await db.bookings.count_documents({
            "user_id": current_user.id,
            "status": "cancelled"
        })
        pending_payment = await db.bookings.count_documents({
            "user_id": current_user.id,
            "payment_status": "pending"
        })
        
        # Get upcoming sessions (confirmed and future date)
        today = datetime.now().strftime('%Y-%m-%d')
        upcoming = 0
        
        bookings = await db.bookings.find({
            "user_id": current_user.id,
            "status": "confirmed"
        }).to_list(100)
        
        for booking in bookings:
            session = await db.sessions.find_one({"id": booking['session_id']}, {"_id": 0})
            if session and session['date'] >= today:
                upcoming += 1
        
        return {
            "total_bookings": total,
            "confirmed_bookings": confirmed,
            "cancelled_bookings": cancelled,
            "pending_payments": pending_payment,
            "upcoming_sessions": upcoming
        }
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# ==================== PAYMENT ROUTES - LIVE VERSION ====================
@api_router.post("/payments/initiate/{booking_id}")
async def initiate_payment(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(f"💰 Initiating payment for booking: {booking_id}")
        
        # Get booking
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        if booking['payment_status'] == 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already completed"
            )
        
        # Get session
        session = await db.sessions.find_one(
            {"id": booking['session_id']},
            {"_id": 0}
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Get existing payment or create new one
        payment = await db.payments.find_one(
            {"booking_id": booking_id},
            {"_id": 0}
        )
        
        if not payment:
            # Create new payment if doesn't exist
            payment_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            payment = {
                "id": payment_id,
                "booking_id": booking_id,
                "amount": booking['amount'],
                "status": "pending",
                "payment_method": "payfast",
                "created_at": now,
                "updated_at": now
            }
            await db.payments.insert_one(payment)
            logger.info(f"✅ New payment created: {payment_id}")
        else:
            payment_id = payment['id']
            logger.info(f"✅ Using existing payment: {payment_id}")
        
        # Prepare PayFast data
        amount_in_rand = booking['amount']
        
        # Split name properly
        name_parts = current_user.full_name.split() if current_user.full_name else []
        name_first = name_parts[0] if name_parts else ''
        name_last = name_parts[-1] if len(name_parts) > 1 else ''
        
        data = {
            'merchant_id': str(PAYFAST_MERCHANT_ID),
            'merchant_key': str(PAYFAST_MERCHANT_KEY),
            'return_url': str(PAYFAST_RETURN_URL),
            'cancel_url': str(PAYFAST_CANCEL_URL),
            'notify_url': str(PAYFAST_NOTIFY_URL),
            'name_first': str(name_first),
            'name_last': str(name_last),
            'email_address': str(current_user.email),
            'm_payment_id': str(payment_id),
            'amount': f"{amount_in_rand:.2f}",
            'item_name': str(f"{session['subject']} - {session['session_type'].replace('_', ' ').title()}"),
            'item_description': str(f"{session['date']} at {session['start_time']}"),
            'custom_str1': str(booking_id),
            'custom_str2': str(current_user.id),
        }
        
        # Clean the passphrase - remove any whitespace
        clean_passphrase = PAYFAST_PASSPHRASE.strip() if PAYFAST_PASSPHRASE else ''
        
        # DEBUG: Log exactly what we're using
        logger.info("=" * 80)
        logger.info("🔍 PAYFAST LIVE DEBUG - SIGNATURE GENERATION:")
        logger.info(f"📧 MERCHANT_ID: '{PAYFAST_MERCHANT_ID}'")
        logger.info(f"🔑 MERCHANT_KEY: '{PAYFAST_MERCHANT_KEY}'")
        logger.info(f"🔐 PASSPHRASE: '{clean_passphrase}' (length: {len(clean_passphrase)})")
        logger.info(f"🌐 NOTIFY_URL: '{PAYFAST_NOTIFY_URL}'")
        logger.info(f"🌐 PAYFAST_URL: '{PAYFAST_URL}'")
        logger.info("=" * 80)
        
        # Generate signature with CLEAN passphrase
        signature = generate_payfast_signature(data, clean_passphrase)
        
        if signature:
            data['signature'] = signature
            logger.info(f"✅ LIVE Signature generated successfully: {signature}")
            
            # Log the sorted parameters that went into signature
            logger.info("📋 Sorted parameters for signature:")
            sorted_keys = sorted([k for k in data.keys() if k != 'signature'])
            for key in sorted_keys:
                logger.info(f"   {key}: {data[key]}")
        else:
            logger.error(f"❌ Failed to generate signature!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate payment signature"
            )
        
        logger.info(f"✅ PayFast LIVE data prepared for payment: {payment_id}")
        
        return {
            "payment_id": payment_id,
            "payment_url": PAYFAST_URL,
            "payment_data": data
        }
        
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    except Exception as e:
        logger.error(f"Payment error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}"
        )

# ==================== NOTIFICATION HELPER FUNCTIONS ====================
async def send_booking_confirmation_email(user_email: str, user_name: str, booking_details: dict, session_details: dict):
    """Send beautifully styled booking confirmation email - with Resend first, fallback to SMTP"""
    try:
        if not EMAIL_ENABLED:
            logger.warning(f"⚠️ Email is disabled. Would send confirmation to: {user_email}")
            return True

        logger.info(f"📧 Attempting to send booking confirmation to: {user_email}")
        
        # Format price in Rands
        amount_rands = booking_details['amount']

        # Logo HTML
        logo_html = ""
        if LOGO_BASE64:
            logo_html = f'''
            <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                    <img src="data:image/png;base64,{LOGO_BASE64}" alt="CubeNotes" width="120" height="120" style="display: inline-block; border-radius: 60px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);">
                    <h1 style="margin: 20px 0 0 0; color: {EMAIL_STYLES['primary']}; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">CubeNotes</h1>
                    <p style="margin: 5px 0 0 0; color: {EMAIL_STYLES['text_light']}; font-size: 16px;">Learning Platform</p>
                </td>
            </tr>
            '''

        # Create content HTML
        content_html = f"""
            <h2 style="margin: 0 0 20px 0; color: {EMAIL_STYLES['text']}; font-size: 28px; font-weight: 700; text-align: center;">
                Booking Confirmed! 🎉
            </h2>
            
            <p style="margin: 0 0 20px 0; color: {EMAIL_STYLES['text']}; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: {EMAIL_STYLES['primary']};">{user_name}</strong>,
            </p>
            
            <p style="margin: 0 0 30px 0; color: {EMAIL_STYLES['text']}; font-size: 16px; line-height: 1.6;">
                Great news! Your tutoring session has been successfully confirmed. Get ready for an amazing learning experience! 🚀
            </p>
            
            <!-- Session Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(135deg, #f9fafb, #f3f4f6); border-radius: 20px;">
                <tr>
                    <td style="padding: 30px;">
                        <h3 style="margin: 0 0 20px 0; color: {EMAIL_STYLES['primary']}; font-size: 20px; font-weight: 700; text-align: center;">
                            📚 Session Details
                        </h3>
                        
                        <table width="100%" cellpadding="10" cellspacing="0" border="0">
                            <tr>
                                <td width="40%" style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Subject:</td>
                                <td style="color: {EMAIL_STYLES['text']}; font-size: 15px; font-weight: 600;">{session_details['subject']}</td>
                            </tr>
                            <tr>
                                <td style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Date:</td>
                                <td style="color: {EMAIL_STYLES['text']}; font-size: 15px; font-weight: 600;">{session_details['date']}</td>
                            </tr>
                            <tr>
                                <td style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Time:</td>
                                <td style="color: {EMAIL_STYLES['text']}; font-size: 15px; font-weight: 600;">{session_details['start_time']} (90 minutes)</td>
                            </tr>
                            <tr>
                                <td style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Session Type:</td>
                                <td style="color: {EMAIL_STYLES['text']}; font-size: 15px; font-weight: 600;">{session_details['session_type'].replace('_', ' ').title()}</td>
                            </tr>
                            <tr>
                                <td style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Amount Paid:</td>
                                <td style="color: {EMAIL_STYLES['success']}; font-size: 18px; font-weight: 700;">R{amount_rands}</td>
                            </tr>
                            {f'''
                            <tr>
                                <td style="color: {EMAIL_STYLES['text_light']}; font-size: 15px;">Your Notes:</td>
                                <td style="color: {EMAIL_STYLES['text']}; font-size: 15px; font-style: italic;">"{booking_details['student_notes']}"</td>
                            </tr>
                            ''' if booking_details.get('student_notes') else ''}
                        </table>
                    </td>
                </tr>
            </table>
            
            <!-- WhatsApp Link Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background-color: {EMAIL_STYLES['whatsapp_bg']}; border: 2px solid {EMAIL_STYLES['whatsapp']}; border-radius: 20px;">
                <tr>
                    <td style="padding: 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📱</div>
                        <h3 style="margin: 0 0 15px 0; color: {EMAIL_STYLES['whatsapp_text']}; font-size: 22px; font-weight: 700;">
                            Your Class Link Will Be Sent via WhatsApp
                        </h3>
                        <p style="margin: 0 0 10px 0; color: {EMAIL_STYLES['whatsapp_text']}; font-size: 16px;">
                            We'll send the meeting link to your WhatsApp number:
                        </p>
                        <p style="margin: 0; color: {EMAIL_STYLES['whatsapp_text']}; font-size: 20px; font-weight: 700; background-color: #ffffff; padding: 12px 20px; border-radius: 50px; display: inline-block;">
                            {booking_details.get('user_phone', 'Your registered number')}
                        </p>
                        <p style="margin: 20px 0 0 0; color: {EMAIL_STYLES['whatsapp_text']}; font-size: 14px;">
                            ⏰ Link will be sent 1 hour before the session
                        </p>
                    </td>
                </tr>
            </table>
            
            <!-- Action Button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                    <td align="center">
                        <a href="{FRONTEND_URL}/my-bookings" style="display: inline-block; padding: 16px 40px; background: {EMAIL_STYLES['primary_gradient']}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 50px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
                            View My Bookings Dashboard
                        </a>
                    </td>
                </tr>
            </table>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid {EMAIL_STYLES['border']};">
            
            <p style="margin: 0 0 10px 0; color: {EMAIL_STYLES['text_light']}; font-size: 14px; text-align: center;">
                <strong>Need to reschedule or have questions?</strong><br>
                Contact us anytime - we're here to help!
            </p>
        """

        # Plain text version
        text = f"""✅ BOOKING CONFIRMED - CubeNotes

Hello {user_name},

GREAT NEWS! Your tutoring session has been CONFIRMED! 🎉

══════════════════════════════
📚 SESSION DETAILS
══════════════════════════════
Subject: {session_details['subject']}
Date: {session_details['date']}
Time: {session_details['start_time']}
Type: {session_details['session_type'].replace('_', ' ').title()}
Amount: R{amount_rands}
{f'Notes: "{booking_details["student_notes"]}"' if booking_details.get('student_notes') else ''}
══════════════════════════════

📱 Your class link will be sent via WhatsApp to: {booking_details.get('user_phone', 'Your registered number')}

View your bookings: {FRONTEND_URL}/my-bookings

Need help?
📧 Email: info@techartistrydesigns.com
📱 WhatsApp: 0746422396

Best regards,
CubeNotes Team"""

        # Attach content to template
        full_html = get_email_template(content_html, logo_html)

        # TRY RESEND FIRST (if API key exists)
        if RESEND_API_KEY:
            logger.info("📧 Attempting to send via Resend API...")
            resend_success = await send_email_via_resend(
                to_email=user_email,
                subject="✅ Booking Confirmed! 🎓 Your Session is Ready - CubeNotes",
                html_content=full_html,
                text_content=text,
                from_email=EMAIL_FROM
            )
            
            if resend_success:
                logger.info(f"✅ Booking confirmation email sent via Resend to: {user_email}")
                return True
            else:
                logger.warning("⚠️ Resend failed, falling back to SMTP...")
        
        # FALLBACK TO SMTP
        logger.info("📧 Falling back to SMTP...")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "✅ Booking Confirmed! 🎓 Your Session is Ready - CubeNotes"
        msg['From'] = f"CubeNotes <{EMAIL_FROM}>"
        msg['To'] = user_email
        msg['Reply-To'] = EMAIL_FROM
        msg['X-Priority'] = '1'

        msg.set_charset('utf-8')
        msg.attach(MIMEText(text, 'plain', 'utf-8'))
        msg.attach(MIMEText(full_html, 'html', 'utf-8'))

        # Send email
        logger.info(f"📧 Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")

        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=30)
        else:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
            server.starttls()

        logger.info(f"📧 Logging in as {SMTP_USERNAME}...")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)

        logger.info(f"📧 Sending message to {user_email}...")
        server.send_message(msg)
        server.quit()

        logger.info(f"✅ Booking confirmation email sent via SMTP to: {user_email}")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send booking confirmation email: {e}")
        logger.error(traceback.format_exc())
        return False

async def send_password_reset_email(email: str, reset_token: str, full_name: str):
    """Send password reset email - with Resend first, fallback to SMTP"""
    try:
        if not EMAIL_ENABLED:
            logger.warning(f"⚠️ Email is disabled. Would send reset email to: {email}")
            logger.warning(f"Reset link: {FRONTEND_URL}/reset-password?token={reset_token}")
            return True

        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        # Logo HTML
        logo_html = ""
        if LOGO_BASE64:
            logo_html = f'''
            <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                    <img src="data:image/png;base64,{LOGO_BASE64}" alt="CubeNotes" width="100" height="100" style="display: inline-block; border-radius: 50px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);">
                </td>
            </tr>
            '''

        # Create content HTML
        content_html = f"""
            <h2 style="margin: 0 0 10px 0; color: {EMAIL_STYLES['text']}; font-size: 28px; font-weight: 700; text-align: center;">
                Password Reset Request
            </h2>
            
            <p style="margin: 0 0 30px 0; color: {EMAIL_STYLES['text_light']}; font-size: 16px; text-align: center;">
                We received a request to reset your password
            </p>
            
            <p style="margin: 0 0 20px 0; color: {EMAIL_STYLES['text']}; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: {EMAIL_STYLES['primary']};">{full_name}</strong>,
            </p>
            
            <p style="margin: 0 0 30px 0; color: {EMAIL_STYLES['text']}; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your CubeNotes account. 
                Click the button below to create a new password. This link will expire in 
                <strong style="color: {EMAIL_STYLES['danger']};">1 hour</strong> for security reasons.
            </p>
            
            <!-- Security Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background-color: #FEF2F2; border-left: 4px solid {EMAIL_STYLES['danger']}; border-radius: 8px;">
                <tr>
                    <td style="padding: 20px;">
                        <p style="margin: 0; color: {EMAIL_STYLES['danger']}; font-size: 14px; line-height: 1.5;">
                            <strong>⚠️ Didn't request this?</strong><br>
                            If you didn't request a password reset, please ignore this email 
                            or contact support if you're concerned about your account security.
                        </p>
                    </td>
                </tr>
            </table>
            
            <!-- Reset Button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                    <td align="center">
                        <a href="{reset_link}" style="display: inline-block; padding: 16px 40px; background: {EMAIL_STYLES['primary_gradient']}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 50px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
                            Reset Password
                        </a>
                    </td>
                </tr>
            </table>
            
            <!-- Alternative Link -->
            <p style="margin: 20px 0 10px 0; color: {EMAIL_STYLES['text_light']}; font-size: 14px; text-align: center;">
                Or copy this link to your browser:
            </p>
            <p style="margin: 0 0 30px 0; padding: 15px; background-color: {EMAIL_STYLES['light']}; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; color: {EMAIL_STYLES['text']}; text-align: center;">
                {reset_link}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 2px solid {EMAIL_STYLES['border']};">
            
            <p style="margin: 0 0 5px 0; color: {EMAIL_STYLES['text_light']}; font-size: 14px; text-align: center;">
                Need help? Contact our support team:
            </p>
            <p style="margin: 0; color: {EMAIL_STYLES['text']}; font-size: 14px; text-align: center;">
                📧 info@techartistrydesigns.com | 📱 074 642 2396
            </p>
        """

        # Plain text version
        text = f"""🔐 PASSWORD RESET REQUEST - CubeNotes

Hello {full_name},

We received a request to reset your password for your CubeNotes account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour for security reasons.

⚠️ If you didn't request this, please ignore this email - your password will remain unchanged.

Need help?
📧 Email: info@techartistrydesigns.com
📱 WhatsApp: 0746422396

Best regards,
CubeNotes Team"""

        # Attach content to template
        full_html = get_email_template(content_html, logo_html)

        # TRY RESEND FIRST (if API key exists)
        if RESEND_API_KEY:
            logger.info("📧 Attempting to send password reset via Resend API...")
            resend_success = await send_email_via_resend(
                to_email=email,
                subject="🔐 Reset Your Password - CubeNotes",
                html_content=full_html,
                text_content=text,
                from_email=EMAIL_FROM
            )
            
            if resend_success:
                logger.info(f"✅ Password reset email sent via Resend to: {email}")
                return True
            else:
                logger.warning("⚠️ Resend failed, falling back to SMTP...")

        # FALLBACK TO SMTP
        logger.info("📧 Falling back to SMTP for password reset...")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🔐 Reset Your Password - CubeNotes"
        msg['From'] = f"CubeNotes <{EMAIL_FROM}>"
        msg['To'] = email
        msg['Reply-To'] = EMAIL_FROM
        msg['X-Priority'] = '1'

        msg.set_charset('utf-8')
        msg.attach(MIMEText(text, 'plain', 'utf-8'))
        msg.attach(MIMEText(full_html, 'html', 'utf-8'))

        # Try different connection methods with increased timeout
        last_error = None

        # Method 1: Try configured port first
        try:
            logger.info(f"📧 Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
            
            if SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=30)
            else:
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30)
                server.starttls()
            
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Password reset email sent via SMTP to: {email}")
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ SMTP failed: {e}")
            return False

    except Exception as e:
        logger.error(f"❌ Failed to send password reset email: {e}")
        logger.error(traceback.format_exc())
        return False

async def send_booking_confirmation_whatsapp(user_phone: str, user_name: str, booking_details: dict, session_details: dict):
    """Send booking confirmation via WhatsApp with class link"""
    try:
        if not WHATSAPP_ENABLED:
            logger.warning(f"⚠️ WhatsApp is disabled. Would send confirmation to: {user_phone}")
            return True
        
        # Import twilio here to avoid dependency if not used
        from twilio.rest import Client
        
        # Initialize Twilio client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Format phone number
        if not user_phone.startswith('whatsapp:'):
            to_number = f"whatsapp:{user_phone}"
        else:
            to_number = user_phone
        
        # Format price in Rands - SHOW FULL AMOUNT
        amount_rands = booking_details['amount']
        
        # Generate class link
        class_link = f"{FRONTEND_URL}/class/{booking_details['id']}"
        
        # Create WhatsApp message with beautiful formatting
        message_body = f"""🎓 *CUBENOTES* - Booking Confirmed! ✅

Hello {user_name}! ✨

Your tutoring session has been CONFIRMED!

*═══════════════════*
📚 *SESSION DETAILS*
*═══════════════════*
Subject: {session_details['subject']}
📅 Date: {session_details['date']}
⏰ Time: {session_details['start_time']}
👥 Type: {session_details['session_type'].replace('_', ' ').title()}
💰 Amount: R{amount_rands}
{f'📝 Notes: "{booking_details["student_notes"]}"' if booking_details.get('student_notes') else ''}
*═══════════════════*

🔗 *YOUR CLASS LINK:*
{class_link}

⏰ *Link will be activated 1 hour before session*

*═══════════════════*
📞 *Need Help?*
• Email: info@techartistrydesigns.com
• WhatsApp: 0746422396
*═══════════════════*

View your bookings: {FRONTEND_URL}/my-bookings

See you in class! 📖

- CubeNotes Team"""
        
        
        # Send message
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_FROM,
            to=to_number
        )
        
        logger.info(f"✅ WhatsApp confirmation sent to {user_phone}: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send WhatsApp confirmation: {e}")
        logger.error(traceback.format_exc())
        return False

# ==================== PAYMENT ROUTES - UPDATED ITN WITH NOTIFICATIONS ====================
@api_router.post("/payments/itn")
async def payfast_itn(
    background_tasks: BackgroundTasks,
    request: Request,
    m_payment_id: Optional[str] = Form(None),
    pf_payment_id: Optional[str] = Form(None),
    payment_status: Optional[str] = Form(None),
    amount_gross: Optional[str] = Form(None),
    amount_fee: Optional[str] = Form(None),
    amount_net: Optional[str] = Form(None),
    item_name: Optional[str] = Form(None),
    item_description: Optional[str] = Form(None),
    custom_str1: Optional[str] = Form(None),
    custom_str2: Optional[str] = Form(None),
    signature: Optional[str] = Form(None),
):
    """Handle PayFast Instant Transaction Notification (ITN)"""
    try:
        logger.info("📩 PayFast ITN received")
        logger.info(f"Payment Status: {payment_status}")
        logger.info(f"Booking ID: {custom_str1}")
        logger.info(f"Payment ID: {m_payment_id}")
        
        if not custom_str1:
            logger.error("❌ No booking ID in ITN data")
            return {"status": "error", "message": "No booking ID"}
        
        if not m_payment_id:
            logger.error("❌ No payment ID in ITN data")
            return {"status": "error", "message": "No payment ID"}
        
        now = datetime.now(timezone.utc)
        
        if payment_status == "COMPLETE":
            # Update payment
            await db.payments.update_one(
                {"id": m_payment_id},
                {
                    "$set": {
                        "status": "completed",
                        "pf_payment_id": pf_payment_id,
                        "updated_at": now
                    }
                }
            )
            logger.info(f"✅ Payment completed: {m_payment_id}")
            
            # Update booking
            await db.bookings.update_one(
                {"id": custom_str1},
                {
                    "$set": {
                        "payment_status": "completed",
                        "status": "confirmed",
                        "updated_at": now
                    }
                }
            )
            logger.info(f"✅ Booking confirmed: {custom_str1}")
            
            # ===== FETCH BOOKING AND USER DETAILS FOR NOTIFICATIONS =====
            # Get booking details
            booking = await db.bookings.find_one(
                {"id": custom_str1},
                {"_id": 0}
            )
            
            if booking:
                # Get session details
                session = await db.sessions.find_one(
                    {"id": booking['session_id']},
                    {"_id": 0}
                )
                
                # Get user details
                user = await db.users.find_one(
                    {"id": booking['user_id']},
                    {"_id": 0}
                )
                
                if user and session:
                    # Add user phone to booking details for WhatsApp
                    booking_with_phone = booking.copy()
                    booking_with_phone['user_phone'] = user.get('phone', '')
                    
                    # Send email notification (in background)
                    if EMAIL_ENABLED:
                        background_tasks.add_task(
                            send_booking_confirmation_email,
                            user['email'],
                            user['full_name'],
                            booking_with_phone,
                            session
                        )
                        logger.info(f"📧 Email notification queued for: {user['email']}")
                    
                    # Send WhatsApp notification (in background)
                    if WHATSAPP_ENABLED and user.get('phone'):
                        background_tasks.add_task(
                            send_booking_confirmation_whatsapp,
                            user['phone'],
                            user['full_name'],
                            booking_with_phone,
                            session
                        )
                        logger.info(f"📱 WhatsApp notification queued for: {user['phone']}")
            
        elif payment_status == "FAILED":
            await db.payments.update_one(
                {"id": m_payment_id},
                {
                    "$set": {
                        "status": "failed",
                        "updated_at": now
                    }
                }
            )
            logger.info(f"❌ Payment failed: {m_payment_id}")
            
            await db.bookings.update_one(
                {"id": custom_str1},
                {
                    "$set": {
                        "payment_status": "failed",
                        "updated_at": now
                    }
                }
            )
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"❌ ITN error: {e}")
        logger.error(traceback.format_exc())
        return {"status": "error", "message": str(e)}

@api_router.get("/payments/verify/{payment_id}")
async def verify_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        payment = await db.payments.find_one(
            {"id": payment_id},
            {"_id": 0}
        )
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        booking = await db.bookings.find_one(
            {"id": payment['booking_id'], "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        return {
            "status": payment['status'],
            "booking_id": payment['booking_id'],
            "amount": payment['amount'],
            "payment_method": payment.get('payment_method', 'payfast')
        }
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@api_router.get("/payments/booking/{booking_id}")
async def get_payment_for_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        payment = await db.payments.find_one(
            {"booking_id": booking_id},
            {"_id": 0}
        )
        
        return {
            "booking": booking,
            "payment": payment
        }
        
    except PyMongoError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# ==================== PASSWORD RESET TOKENS COLLECTION ====================
password_reset_tokens = db.password_reset_tokens

# ==================== PASSWORD RESET ROUTES ====================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks
):
    """
    Request a password reset email
    """
    try:
        logger.info(f"📧 Password reset requested for: {request.email}")
        logger.info(f"📧 EMAIL_ENABLED = {EMAIL_ENABLED}")
        
        # Find user
        user = await db.users.find_one({"email": request.email}, {"_id": 0})
        
        # Always return success even if user doesn't exist (security best practice)
        if not user:
            logger.info(f"⚠️ Password reset requested for non-existent email: {request.email}")
            return {
                "success": True,
                "message": "If an account exists with this email, you will receive reset instructions."
            }
        
        logger.info(f"✅ User found: {user['id']} - {user.get('full_name', 'Unknown')}")
        
        # Generate reset token (valid for 1 hour)
        token_data = {
            "sub": user['id'],
            "email": user['email'],
            "type": "password_reset",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1)
        }
        reset_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        # Store token in database
        token_doc = {
            "user_id": user['id'],
            "token": reset_token,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False
        }
        await password_reset_tokens.insert_one(token_doc)
        logger.info(f"✅ Reset token stored in database")
        
        # Check if email is enabled
        if not EMAIL_ENABLED:
            logger.warning(f"⚠️ Email is disabled! Would send to: {user['email']}")
            logger.warning(f"🔗 Reset link: {FRONTEND_URL}/reset-password?token={reset_token}")
            return {
                "success": True,
                "message": "If an account exists with this email, you will receive reset instructions.",
                "debug": f"Email disabled. Reset link: {FRONTEND_URL}/reset-password?token={reset_token}"
            }
        
        # Queue email sending in background
        logger.info(f"📧 Queueing password reset email to: {user['email']}")
        background_tasks.add_task(
            send_password_reset_email,
            email=user['email'],
            reset_token=reset_token,
            full_name=user.get('full_name', 'Student')
        )
        logger.info(f"✅ Email task queued successfully")
        
        # Return immediately
        return {
            "success": True,
            "message": "If an account exists with this email, you will receive reset instructions."
        }
        
    except PyMongoError as e:
        logger.error(f"❌ Database error in forgot_password: {e}")
        logger.error(traceback.format_exc())
        # Still return success for security
        return {
            "success": True,
            "message": "If an account exists with this email, you will receive reset instructions."
        }
    except Exception as e:
        logger.error(f"❌ Unexpected error in forgot_password: {e}")
        logger.error(traceback.format_exc())
        # Still return success for security
        return {
            "success": True,
            "message": "If an account exists with this email, you will receive reset instructions."
        }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password using token
    """
    try:
        logger.info("🔐 Password reset attempt with token")
        logger.info(f"Token length: {len(request.token)}")
        
        # Verify token
        try:
            payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
            logger.info(f"✅ Token decoded successfully for user: {payload.get('sub')}")
        except jwt.ExpiredSignatureError:
            logger.error("❌ Token has expired")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired. Please request a new one."
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"❌ Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token. Please request a new one."
            )
        
        # Check token type
        if payload.get('type') != 'password_reset':
            logger.error(f"❌ Invalid token type: {payload.get('type')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )
        
        user_id = payload.get('sub')
        if not user_id:
            logger.error("❌ No user ID in token payload")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token payload"
            )
        
        # Check if token exists in database and not used
        token_record = await password_reset_tokens.find_one({
            "token": request.token,
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not token_record:
            logger.error("❌ Token not found in database or already used")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        logger.info(f"✅ Token verified for user: {user_id}")
        
        # Hash new password
        hashed_password = hash_password(request.new_password)
        logger.info("✅ New password hashed")
        
        # Update user password
        result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            logger.error(f"❌ User not found: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"✅ Password updated for user: {user_id}")
        
        # Mark token as used
        await password_reset_tokens.update_one(
            {"token": request.token},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        logger.info(f"✅ Token marked as used")
        
        logger.info(f"✅ Password reset successful for user: {user_id}")
        
        return {
            "success": True,
            "message": "Password has been reset successfully. You can now login with your new password."
        }
        
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in reset_password: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred. Please try again."
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in reset_password: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred. Please try again."
        )

@api_router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """
    Verify if a reset token is valid
    """
    try:
        logger.info(f"🔍 Verifying reset token: {token[:20]}...")
        
        # Check if token exists and not used
        token_record = await password_reset_tokens.find_one({
            "token": token,
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not token_record:
            logger.warning("❌ Token invalid or expired")
            return {"valid": False}
        
        logger.info("✅ Token is valid")
        return {"valid": True}
        
    except Exception as e:
        logger.error(f"❌ Error verifying token: {e}")
        logger.error(traceback.format_exc())
        return {"valid": False}

# Add this test endpoint to debug email issues
@api_router.post("/test/email-debug")
async def test_email_debug(request: ForgotPasswordRequest):
    """
    Debug endpoint to test email configuration
    """
    try:
        logger.info("=" * 60)
        logger.info("🔍 EMAIL DEBUG TEST")
        logger.info("=" * 60)
        
        # Log email settings
        logger.info(f"EMAIL_ENABLED: {EMAIL_ENABLED}")
        logger.info(f"RESEND_API_KEY configured: {bool(RESEND_API_KEY)}")
        logger.info(f"SMTP_SERVER: {SMTP_SERVER}")
        logger.info(f"SMTP_PORT: {SMTP_PORT}")
        logger.info(f"SMTP_USERNAME: {SMTP_USERNAME}")
        logger.info(f"EMAIL_FROM: {EMAIL_FROM}")
        
        # Find user
        user = await db.users.find_one({"email": request.email}, {"_id": 0})
        if not user:
            return {
                "success": False,
                "message": "User not found",
                "email_settings": {
                    "enabled": EMAIL_ENABLED,
                    "resend_configured": bool(RESEND_API_KEY),
                    "server": SMTP_SERVER,
                    "port": SMTP_PORT,
                    "username": SMTP_USERNAME,
                    "from": EMAIL_FROM
                }
            }
        
        # Generate test token
        test_token = "test-token-" + str(uuid.uuid4())[:8]
        
        # Try to send test email via Resend first
        if RESEND_API_KEY:
            logger.info("📧 Testing Resend API...")
            
            test_html = f"""
            <h2>Resend Test Email</h2>
            <p>Hello {user.get('full_name', 'Student')},</p>
            <p>This is a test email from CubeNotes sent via <strong>Resend API</strong>.</p>
            <p>Reset link would be: {FRONTEND_URL}/reset-password?token={test_token}</p>
            """
            
            test_text = f"Resend Test - Reset link: {FRONTEND_URL}/reset-password?token={test_token}"
            
            resend_result = await send_email_via_resend(
                to_email=request.email,
                subject="🔧 CubeNotes Resend Test",
                html_content=test_html,
                text_content=test_text
            )
            
            if resend_result:
                return {
                    "success": True,
                    "message": "Test email sent via Resend successfully",
                    "method": "resend",
                    "user": user.get('email')
                }
        
        # Fall back to SMTP test
        logger.info("📧 Testing SMTP...")
        
        # Import smtplib here
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🔧 CubeNotes SMTP Test"
        msg['From'] = f"CubeNotes <{EMAIL_FROM}>"
        msg['To'] = request.email
        msg['Reply-To'] = EMAIL_FROM
        
        # Simple test content
        text = f"""🔧 SMTP TEST

Hello {user.get('full_name', 'Student')},

This is a test email from CubeNotes via SMTP.

Reset link would be: {FRONTEND_URL}/reset-password?token={test_token}"""

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CubeNotes SMTP Test</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #4F46E5; text-align: center;">🔧 CubeNotes SMTP Test</h1>
        <p style="font-size: 16px; color: #333;">Hello <strong>{user.get('full_name', 'Student')}</strong>,</p>
        <p style="font-size: 16px; color: #333;">This is a test email from CubeNotes via SMTP.</p>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
            Reset link would be: <code style="background-color: #f0f0f0; padding: 5px; border-radius: 3px;">{FRONTEND_URL}/reset-password?token={test_token}</code>
        </p>
    </div>
</body>
</html>"""
        
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        
        # Try to connect and send
        results = {
            "port_465_ssl": False,
            "port_587_tls": False
        }
        
        # Try SSL on port 465
        try:
            logger.info("📧 Testing SSL on port 465...")
            server = smtplib.SMTP_SSL(SMTP_SERVER, 465, timeout=10)
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info("✅ SSL on port 465 SUCCESSFUL!")
            results["port_465_ssl"] = True
        except Exception as e:
            logger.warning(f"⚠️ SSL port 465 failed: {e}")
        
        # Try TLS on port 587
        try:
            logger.info("📧 Testing TLS on port 587...")
            server = smtplib.SMTP(SMTP_SERVER, 587, timeout=10)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info("✅ TLS on port 587 SUCCESSFUL!")
            results["port_587_tls"] = True
        except Exception as e:
            logger.warning(f"⚠️ TLS port 587 failed: {e}")
        
        # Determine if any method worked
        any_success = any(results.values())
        
        if any_success:
            working_ports = [port for port, worked in results.items() if worked]
            suggestion = f"Use one of these ports: {', '.join(working_ports)}"
        else:
            suggestion = "No connection methods worked. Use Resend instead (recommended)."
        
        return {
            "success": any_success,
            "message": "SMTP test completed",
            "method": "smtp" if any_success else "failed",
            "user": user.get('email'),
            "email_settings": {
                "enabled": EMAIL_ENABLED,
                "resend_configured": bool(RESEND_API_KEY),
                "server": SMTP_SERVER,
                "configured_port": SMTP_PORT,
                "username": SMTP_USERNAME,
                "from": EMAIL_FROM
            },
            "test_results": results,
            "suggestion": suggestion
        }
            
    except Exception as e:
        logger.error(f"❌ Debug endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ==================== TEST RESEND ENDPOINT ====================
@api_router.post("/test/resend")
async def test_resend(
    email: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Test Resend email configuration
    """
    try:
        test_email = email or current_user.email
        
        # Simple test HTML
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resend Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <h1 style="color: #4F46E5; text-align: center;">✅ Resend Test Successful!</h1>
                <p style="font-size: 16px; color: #333;">Hello {current_user.full_name},</p>
                <p style="font-size: 16px; color: #333;">This email was sent using <strong>Resend API</strong> instead of SMTP.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0; color: #4F46E5; font-family: monospace;">
                        ✓ No more SMTP blocking issues!
                    </p>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                    Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </div>
        </body>
        </html>
        """
        
        text = f"Resend Test - Hello {current_user.full_name}, this email was sent via Resend API!"
        
        result = await send_email_via_resend(
            to_email=test_email,
            subject="✅ Resend API Test - CubeNotes",
            html_content=html,
            text_content=text
        )
        
        return {
            "success": result,
            "message": "Test email sent via Resend" if result else "Resend failed",
            "email": test_email,
            "resend_configured": bool(RESEND_API_KEY)
        }
        
    except Exception as e:
        logger.error(f"❌ Test resend error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ==================== TEST NOTIFICATION ENDPOINT ====================
@api_router.post("/test/send-notification")
async def test_notification(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Test endpoint to send email and WhatsApp notifications"""
    try:
        # Get user's most recent booking
        booking = await db.bookings.find_one(
            {"user_id": current_user.id},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No bookings found"
            )
        
        # Get session details
        session = await db.sessions.find_one(
            {"id": booking['session_id']},
            {"_id": 0}
        )
        
        # Add user phone to booking details
        booking_with_phone = booking.copy()
        booking_with_phone['user_phone'] = current_user.phone
        
        results = {"email": False, "whatsapp": False}
        
        # Test email
        if EMAIL_ENABLED:
            email_sent = await send_booking_confirmation_email(
                current_user.email,
                current_user.full_name,
                booking_with_phone,
                session
            )
            results["email"] = email_sent
        
        # Test WhatsApp
        if WHATSAPP_ENABLED and current_user.phone:
            whatsapp_sent = await send_booking_confirmation_whatsapp(
                current_user.phone,
                current_user.full_name,
                booking_with_phone,
                session
            )
            results["whatsapp"] = whatsapp_sent
        
        return {
            "success": True,
            "message": "Notifications sent",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"❌ Test notification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ==================== SEED DATA ====================
@api_router.post("/seed-sessions")
async def seed_sessions():
    """
    SEED SESSIONS - SUNDAYS = GROUP (10 spots), WEEKDAYS = 1-ON-1 (1 spot)
    """
    try:
        # 1. Clear existing sessions
        await db.sessions.delete_many({})
        logger.info("✅ Cleared existing sessions")
        
        sessions = []
        today = datetime.now()
        
        # ============ SUNDAYS - GROUP CLASSES (10 SPOTS EACH) ============
        # Get next Sunday
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        next_sunday = today + timedelta(days=days_until_sunday)
        
        # Create 4 Sundays of group classes
        for week in range(4):
            sunday = next_sunday + timedelta(days=week * 7)
            date_str = sunday.strftime('%Y-%m-%d')
            weekday_name = sunday.strftime('%A')
            
            # SUNDAY 09:00 - MATHS GROUP (10 spots)
            sessions.append({
                "id": str(uuid.uuid4()),
                "session_type": "group",
                "subject": "Maths",
                "date": date_str,
                "start_time": "09:00",
                "duration_minutes": 90,
                "price": 500,
                "max_students": 10,
                "current_bookings": 0,
                "available": True,
                "created_at": datetime.now(timezone.utc)
            })
            
            # SUNDAY 11:00 - PHYSICAL SCIENCES GROUP (10 spots)
            sessions.append({
                "id": str(uuid.uuid4()),
                "session_type": "group",
                "subject": "Physical Sciences",
                "date": date_str,
                "start_time": "11:00",
                "duration_minutes": 90,
                "price": 500,
                "max_students": 10,
                "current_bookings": 0,
                "available": True,
                "created_at": datetime.now(timezone.utc)
            })
            
            logger.info(f"📅 Added Sunday group: {weekday_name} {date_str} - Maths @09:00, Science @11:00 (10 spots each)")
        
        # ============ WEEKDAYS - 1-ON-1 SESSIONS (1 SPOT EACH) ============
        # Get next Monday
        days_until_monday = (0 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday)
        
        # Create 2 weeks of weekday 1-on-1 sessions
        for week in range(2):
            for day in range(5):
                weekday = next_monday + timedelta(days=week * 7 + day)
                date_str = weekday.strftime('%Y-%m-%d')
                day_name = weekday.strftime('%A')
                
                # Each day has 3 time slots: 14:00, 16:00, 18:00
                for time in ["14:00", "16:00", "18:00"]:
                    # MATHS 1-on-1 (1 spot)
                    sessions.append({
                        "id": str(uuid.uuid4()),
                        "session_type": "one_on_one",
                        "subject": "Maths",
                        "date": date_str,
                        "start_time": time,
                        "duration_minutes": 90,
                        "price": 200,
                        "max_students": 1,
                        "current_bookings": 0,
                        "available": True,
                        "created_at": datetime.now(timezone.utc)
                    })
                    
                    # PHYSICAL SCIENCES 1-on-1 (1 spot)
                    sessions.append({
                        "id": str(uuid.uuid4()),
                        "session_type": "one_on_one",
                        "subject": "Physical Sciences",
                        "date": date_str,
                        "start_time": time,
                        "duration_minutes": 90,
                        "price": 200,
                        "max_students": 1,
                        "current_bookings": 0,
                        "available": True,
                        "created_at": datetime.now(timezone.utc)
                    })
                
                logger.info(f"📅 Added {day_name} {date_str}: 6 one-on-one sessions (3 times × 2 subjects) - 1 spot each")
        
        # ============ INSERT ALL SESSIONS ============
        if sessions:
            result = await db.sessions.insert_many(sessions)
            
            # Calculate stats
            group_sessions = [s for s in sessions if s['session_type'] == 'group']
            one_on_one_sessions = [s for s in sessions if s['session_type'] == 'one_on_one']
            
            group_spots = len(group_sessions) * 10
            one_on_one_spots = len(one_on_one_sessions)
            total_spots = group_spots + one_on_one_spots
            
            logger.info("=" * 60)
            logger.info("✅✅✅ SESSIONS SEEDED SUCCESSFULLY ✅✅✅")
            logger.info("=" * 60)
            logger.info(f"📊 TOTAL SESSIONS: {len(sessions)}")
            logger.info(f"   ├─ SUNDAY Group Classes: {len(group_sessions)} sessions")
            logger.info(f"   │  └─ Total group spots: {group_spots}")
            logger.info(f"   └─ WEEKDAY 1-on-1 Sessions: {len(one_on_one_sessions)} sessions")
            logger.info(f"      └─ Total 1-on-1 spots: {one_on_one_spots}")
            logger.info("=" * 60)
            logger.info(f"🎫 TOTAL AVAILABLE SPOTS: {total_spots}")
            logger.info("=" * 60)
        
        return {
            "success": True,
            "message": "Sessions seeded successfully",
            "stats": {
                "total_sessions": len(sessions),
                "sunday_group_sessions": len(group_sessions),
                "weekday_one_on_one_sessions": len(one_on_one_sessions),
                "total_group_spots": group_spots,
                "total_one_on_one_spots": one_on_one_spots,
                "total_available_spots": total_spots
            }
        }
        
    except PyMongoError as e:
        logger.error(f"❌ Database error in seed_sessions: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in seed_sessions: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )

# ==================== TEST USER ENDPOINT ====================
@api_router.post("/test/create-test-user")
async def create_test_user():
    """Create a test user for development"""
    try:
        # Check if test user exists
        existing = await db.users.find_one({"email": "test@example.com"})
        if existing:
            token = create_access_token({"sub": existing['id']})
            if '_id' in existing:
                del existing['_id']
            
            logger.info(f"✅ Test user already exists: {existing['id']}")
            return {
                "message": "Test user already exists",
                "user_id": existing['id'],
                "token": token,
                "user": {
                    "id": existing['id'],
                    "email": existing['email'],
                    "full_name": existing['full_name'],
                    "grade": existing['grade'],
                    "phone": existing['phone']
                }
            }
        
        # Create new test user
        hashed_pw = hash_password("test123")
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        user = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test Student",
            "grade": "10",
            "phone": "0712345678",
            "hashed_password": hashed_pw,
            "created_at": now
        }
        
        await db.users.insert_one(user)
        logger.info(f"✅ New test user created: {user_id}")
        
        token = create_access_token({"sub": user_id})
        
        return {
            "message": "Test user created successfully",
            "user_id": user_id,
            "token": token,
            "user": {
                "id": user_id,
                "email": user["email"],
                "full_name": user["full_name"],
                "grade": user["grade"],
                "phone": user["phone"]
            }
        }
        
    except PyMongoError as e:
        logger.error(f"❌ Database error in create_test_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# ==================== TEST ENDPOINTS ====================
@api_router.get("/test/health")
async def test_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cors_origins": CORS_ORIGINS
    }

@api_router.get("/test/db")
async def test_db():
    try:
        await db.command("ping")
        collections = await db.list_collection_names()
        return {
            "status": "connected",
            "database": db.name,
            "collections": collections
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# ==================== MIDDLEWARE & ROUTER SETUP ====================
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("✅ MongoDB connection closed")

@app.get("/")
async def root():
    return {
        "message": "Tutoring Booking API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now(timezone.utc)
    try:
        response = await call_next(request)
        process = (datetime.now(timezone.utc) - start).total_seconds()
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process:.3f}s")
        return response
    except Exception as e:
        logger.error(f"Request failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )