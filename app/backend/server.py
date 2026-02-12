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

# ==================== PAYFAST CONFIGURATION - NO DEFAULTS! ====================
PAYFAST_MERCHANT_ID = os.environ.get('PAYFAST_MERCHANT_ID')
PAYFAST_MERCHANT_KEY = os.environ.get('PAYFAST_MERCHANT_KEY')
PAYFAST_PASSPHRASE = os.environ.get('PAYFAST_PASSPHRASE')
PAYFAST_URL = os.environ.get('PAYFAST_URL', 'https://sandbox.payfast.co.za/eng/process')
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

logger.info(f"✅ PayFast configured for Merchant ID: {PAYFAST_MERCHANT_ID}")
logger.info(f"✅ PayFast Notify URL: {PAYFAST_NOTIFY_URL}")

# Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@tutorhub.com')
EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'false').lower() == 'true'

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

# ==================== PAYFAST HELPERS ====================
def generate_payfast_signature(data: dict, passphrase: str) -> str:
    try:
        sorted_keys = sorted([k for k in data.keys() if k != 'signature'])
        param_string = '&'.join([f"{k}={urllib.parse.quote_plus(str(data[k]))}" for k in sorted_keys])
        if passphrase:
            param_string += f"&passphrase={urllib.parse.quote_plus(passphrase)}"
        return hashlib.md5(param_string.encode('utf-8')).hexdigest()
    except Exception as e:
        logger.error(f"Error generating PayFast signature: {e}")
        return ""

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
        
        # ===== RETURN BOOKING WITH PAYMENT INFO AND REDIRECT FLAG =====
        return {
            "success": True,
            "message": "Booking created successfully",
            "booking_id": booking_id,
            "booking": {
                **booking,
                "session": session
            },
            "payment": {
                "payment_id": payment_id,
                "status": "pending"
            },
            "redirect_to_payment": True,  # 🔥 CRITICAL: Frontend must redirect
            "redirect_url": f"/payment/{booking_id}"  # 🔥 Direct URL for redirect
        }
        
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

# ==================== PAYMENT ROUTES ====================
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
        amount_in_rand = booking['amount'] / 100.0
        
        data = {
            'merchant_id': PAYFAST_MERCHANT_ID,
            'merchant_key': PAYFAST_MERCHANT_KEY,
            'return_url': PAYFAST_RETURN_URL,
            'cancel_url': PAYFAST_CANCEL_URL,
            'notify_url': PAYFAST_NOTIFY_URL,
            'name_first': current_user.full_name.split()[0] if current_user.full_name else '',
            'name_last': current_user.full_name.split()[-1] if len(current_user.full_name.split()) > 1 else '',
            'email_address': current_user.email,
            'm_payment_id': payment_id,
            'amount': f"{amount_in_rand:.2f}",
            'item_name': f"{session['subject']} - {session['session_type'].replace('_', ' ').title()}",
            'item_description': f"{session['date']} at {session['start_time']}",
            'custom_str1': booking_id,
            'custom_str2': current_user.id,
        }
        
        signature = generate_payfast_signature(data, PAYFAST_PASSPHRASE)
        if signature:
            data['signature'] = signature
        
        logger.info(f"✅ PayFast data prepared for payment: {payment_id}")
        
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
            detail="Payment initialization failed"
        )

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
        if days_until_sunday == 0:  # Today is Sunday
            days_until_sunday = 7   # Next Sunday
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
        if days_until_monday == 0:  # Today is Monday
            days_until_monday = 7   # Next Monday
        next_monday = today + timedelta(days=days_until_monday)
        
        # Create 2 weeks of weekday 1-on-1 sessions
        for week in range(2):
            for day in range(5):  # Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4
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
            
            # ============ PRINT SUMMARY ============
            logger.info("=" * 60)
            logger.info("✅✅✅ SESSIONS SEEDED SUCCESSFULLY ✅✅✅")
            logger.info("=" * 60)
            logger.info(f"📊 TOTAL SESSIONS: {len(sessions)}")
            logger.info(f"   ├─ SUNDAY Group Classes: {len(group_sessions)} sessions")
            logger.info(f"   │  ├─ Each has 10 spots")
            logger.info(f"   │  ├─ Subjects: Maths, Physical Sciences")
            logger.info(f"   │  ├─ Times: 09:00, 11:00")
            logger.info(f"   │  └─ Total group spots: {group_spots}")
            logger.info(f"   │")
            logger.info(f"   └─ WEEKDAY 1-on-1 Sessions: {len(one_on_one_sessions)} sessions")
            logger.info(f"      ├─ Each has 1 spot")
            logger.info(f"      ├─ Subjects: Maths, Physical Sciences")
            logger.info(f"      ├─ Times: 14:00, 16:00, 18:00")
            logger.info(f"      └─ Total 1-on-1 spots: {one_on_one_spots}")
            logger.info("=" * 60)
            logger.info(f"🎫 TOTAL AVAILABLE SPOTS: {total_spots}")
            logger.info("=" * 60)
            
            # ============ SHOW NEXT SUNDAY ============
            next_sunday_str = next_sunday.strftime('%Y-%m-%d')
            sunday_groups = [s for s in sessions if s['date'] == next_sunday_str and s['session_type'] == 'group']
            
            logger.info(f"\n📅 NEXT SUNDAY ({next_sunday.strftime('%A %d %B %Y')}):")
            for s in sunday_groups:
                logger.info(f"   • {s['subject']} @ {s['start_time']} - {s['max_students']} spots available")
            
            # ============ SHOW TOMORROW ============
            tomorrow = (today + timedelta(days=1)).strftime('%Y-%m-%d')
            tomorrow_sessions = [s for s in sessions if s['date'] == tomorrow and s['session_type'] == 'one_on_one']
            
            if tomorrow_sessions:
                logger.info(f"\n📅 TOMORROW ({ (today + timedelta(days=1)).strftime('%A %d %B %Y') }):")
                time_slots = {}
                for s in tomorrow_sessions:
                    if s['start_time'] not in time_slots:
                        time_slots[s['start_time']] = []
                    time_slots[s['start_time']].append(s['subject'])
                
                for time, subjects in time_slots.items():
                    logger.info(f"   • {time}: {', '.join(subjects)} (1 spot each)")
            
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
            },
            "schedule": {
                "sundays": {
                    "days": [next_sunday.strftime('%Y-%m-%d')],
                    "times": ["09:00", "11:00"],
                    "subjects": ["Maths", "Physical Sciences"],
                    "spots_per_session": 10
                },
                "weekdays": {
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "times": ["14:00", "16:00", "18:00"],
                    "subjects": ["Maths", "Physical Sciences"],
                    "spots_per_session": 1
                }
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
            # Remove _id for response
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
        
        # Create token
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