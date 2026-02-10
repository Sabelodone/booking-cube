from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Form, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Any, Dict
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# PayFast Configuration
PAYFAST_MERCHANT_ID = os.environ.get('PAYFAST_MERCHANT_ID', '33659219')
PAYFAST_MERCHANT_KEY = os.environ.get('PAYFAST_MERCHANT_KEY', 'nndijqaomyseg')
PAYFAST_PASSPHRASE = os.environ.get('PAYFAST_PASSPHRASE', '')
PAYFAST_URL = os.environ.get('PAYFAST_URL', 'https://sandbox.payfast.co.za/eng/process')
PAYFAST_RETURN_URL = os.environ.get('PAYFAST_RETURN_URL', 'http://localhost:5173/payment-success')
PAYFAST_CANCEL_URL = os.environ.get('PAYFAST_CANCEL_URL', 'http://localhost:5173/payment-failed')
PAYFAST_NOTIFY_URL = os.environ.get('PAYFAST_NOTIFY_URL', 'http://localhost:8000/api/payments/itn')
PAYFAST_ENV = os.environ.get('PAYFAST_ENV', 'sandbox')  # sandbox or production

# Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@tutorhub.com')
EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'false').lower() == 'true'

# WhatsApp Configuration (using Twilio)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')  # Twilio sandbox number
WHATSAPP_ENABLED = os.environ.get('WHATSAPP_ENABLED', 'false').lower() == 'true'

# Frontend URL for session links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# Validate configurations
if not PAYFAST_MERCHANT_ID or not PAYFAST_MERCHANT_KEY:
    logger = logging.getLogger(__name__)
    logger.error("PayFast credentials not configured. Check your .env file")

if EMAIL_ENABLED and (not SMTP_USERNAME or not SMTP_PASSWORD):
    logger.warning("Email notifications enabled but SMTP credentials not configured")

if WHATSAPP_ENABLED and (not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN):
    logger.warning("WhatsApp notifications enabled but Twilio credentials not configured")

# CORS Configuration
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')

security = HTTPBearer()

# Create the main app
app = FastAPI(
    title="Tutoring Booking API",
    description="API for booking tutoring sessions with PayFast payment integration and notifications",
    version="1.0.0"
)
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


# ==================== MODELS ====================

# User Models
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    grade: Grade
    phone: str

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

# Session Models
class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_type: SessionType
    subject: Subject
    date: str  # YYYY-MM-DD format
    start_time: str  # HH:MM format
    duration_minutes: int  # 90 minutes
    price: int  # R500 for group, R200 for 1-on-1
    max_students: int  # 10 for group, 1 for 1-on-1
    current_bookings: int = 0
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Booking Models
class BookingCreate(BaseModel):
    session_id: str
    student_notes: Optional[str] = None

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

# Payment Models
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


# ==================== NOTIFICATION FUNCTIONS ====================

async def send_email_notification(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    """Send email notification"""
    if not EMAIL_ENABLED:
        logger.info(f"Email disabled. Would send to {to_email}: {subject}")
        return
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        
        # Attach plain text version
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        # Attach HTML version if provided
        if html_body:
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"✅ Email sent to {to_email}: {subject}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")

async def send_whatsapp_notification(to_phone: str, message: str):
    """Send WhatsApp notification via Twilio"""
    if not WHATSAPP_ENABLED:
        logger.info(f"WhatsApp disabled. Would send to {to_phone}: {message[:50]}...")
        return
    
    try:
        # Format phone number for WhatsApp (remove spaces, add country code if needed)
        if not to_phone.startswith('+'):
            # Assuming South African numbers: add +27 and remove leading 0
            if to_phone.startswith('0'):
                to_phone = '+27' + to_phone[1:]
            else:
                to_phone = '+27' + to_phone
        
        whatsapp_to = f"whatsapp:{to_phone}"
        
        # Send via Twilio API
        async with httpx.AsyncClient() as client:
            auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            
            data = {
                'From': TWILIO_WHATSAPP_FROM,
                'To': whatsapp_to,
                'Body': message
            }
            
            response = await client.post(url, data=data, auth=auth)
            
            if response.status_code == 201:
                logger.info(f"✅ WhatsApp sent to {to_phone}")
            else:
                logger.error(f"❌ Failed to send WhatsApp to {to_phone}: {response.text}")
                
    except Exception as e:
        logger.error(f"❌ WhatsApp error for {to_phone}: {e}")

async def send_session_confirmation_notifications(
    booking_id: str, 
    user_email: str, 
    user_phone: str, 
    user_name: str,
    session_details: Dict,
    booking_details: Dict
):
    """Send confirmation notifications for a booked session"""
    
    # Format date and time
    session_date = datetime.strptime(session_details['date'], '%Y-%m-%d').strftime('%d %B %Y')
    session_time = session_details['start_time']
    session_duration = session_details['duration_minutes']
    
    # Create session link (assuming frontend has a session details page)
    session_link = f"{FRONTEND_URL}/my-bookings/{booking_id}"
    
    # Email content
    email_subject = f"✅ Session Confirmed: {session_details['subject']} on {session_date}"
    
    email_body = f"""
Hello {user_name},

Your tutoring session has been confirmed!

📚 Session Details:
• Subject: {session_details['subject']}
• Type: {session_details['session_type'].replace('_', ' ').title()}
• Date: {session_date}
• Time: {session_time} ({session_duration} minutes)
• Price: R{session_details['price']}
• Booking ID: {booking_id}

🔗 View your session details: {session_link}

💡 Please join 5 minutes before the scheduled time.
📝 Bring any questions or topics you'd like to cover.

If you need to reschedule or cancel, please do so at least 24 hours in advance.

Best regards,
TutorHub Team
"""
    
    email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Session Confirmed!</h1>
            <p>Your tutoring session is booked and confirmed</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your tutoring session has been successfully booked and confirmed!</p>
            
            <div class="details">
                <h3>📚 Session Details</h3>
                <p><strong>Subject:</strong> {session_details['subject']}</p>
                <p><strong>Type:</strong> {session_details['session_type'].replace('_', ' ').title()}</p>
                <p><strong>Date:</strong> {session_date}</p>
                <p><strong>Time:</strong> {session_time} ({session_duration} minutes)</p>
                <p><strong>Price:</strong> R{session_details['price']}</p>
                <p><strong>Booking ID:</strong> {booking_id}</p>
            </div>
            
            <p>
                <a href="{session_link}" class="button">View Session Details</a>
            </p>
            
            <h4>💡 Important Notes:</h4>
            <ul>
                <li>Please join 5 minutes before the scheduled time</li>
                <li>Bring any questions or topics you'd like to cover</li>
                <li>To reschedule or cancel, please do so at least 24 hours in advance</li>
            </ul>
            
            <div class="footer">
                <p>Best regards,<br>The TutorHub Team</p>
                <p>Need help? Contact us at support@tutorhub.com</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    # WhatsApp message (shorter version)
    whatsapp_message = f"""
🎉 *Session Confirmed!*

Hello {user_name},

Your {session_details['subject']} session is confirmed:

📅 *Date:* {session_date}
⏰ *Time:* {session_time}
📚 *Type:* {session_details['session_type'].replace('_', ' ').title()}
💰 *Paid:* R{session_details['price']}
🔗 *Details:* {session_link}

Please join 5 minutes early. Bring your questions!

_Reply STOP to unsubscribe_
"""
    
    # Send notifications in parallel
    try:
        email_task = send_email_notification(user_email, email_subject, email_body, email_html)
        whatsapp_task = send_whatsapp_notification(user_phone, whatsapp_message)
        
        # Run both async
        import asyncio
        await asyncio.gather(email_task, whatsapp_task, return_exceptions=True)
        
        logger.info(f"✅ Notifications sent for booking {booking_id}")
        
    except Exception as e:
        logger.error(f"❌ Error sending notifications for booking {booking_id}: {e}")


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**user_doc)
    except PyMongoError as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup", summary="Register a new user")
async def signup(user_data: UserSignUp):
    """
    Create a new user account.
    
    Returns a JWT token for authentication.
    """
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        hashed_pw = hash_password(user_data.password)
        user = UserInDB(
            email=user_data.email,
            full_name=user_data.full_name,
            grade=user_data.grade,
            phone=user_data.phone,
            hashed_password=hashed_pw
        )
        
        await db.users.insert_one(user.model_dump())
        
        # Create token
        token = create_access_token({"sub": user.id})
        
        return {
            "message": "User created successfully",
            "token": token,
            "user": User(**user.model_dump()).model_dump()
        }
    except PyMongoError as e:
        logger.error(f"Database error in signup: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.post("/auth/login", summary="Login user")
async def login(credentials: UserLogin):
    """
    Authenticate user and return JWT token.
    """
    try:
        # Find user
        user_doc = await db.users.find_one({"email": credentials.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = UserInDB(**user_doc)
        
        # Verify password
        if not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create token
        token = create_access_token({"sub": user.id})
        
        return {
            "message": "Login successful",
            "token": token,
            "user": User(**user.model_dump()).model_dump()
        }
    except PyMongoError as e:
        logger.error(f"Database error in login: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.get("/auth/me", summary="Get current user info")
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get information about the currently authenticated user.
    
    Requires valid JWT token.
    """
    return current_user


# ==================== SESSION ROUTES ====================

@api_router.get("/sessions", summary="Get available sessions")
async def get_sessions(
    session_type: Optional[SessionType] = None,
    subject: Optional[Subject] = None,
    available_only: bool = True
):
    """
    Get list of available tutoring sessions.
    
    Can filter by session type, subject, and availability.
    """
    try:
        query = {}
        
        if session_type:
            query["session_type"] = session_type
        if subject:
            query["subject"] = subject
        if available_only:
            query["available"] = True
        
        sessions = await db.sessions.find(query, {"_id": 0}).to_list(100)
        return sorted(sessions, key=lambda x: (x['date'], x['start_time']))
    except PyMongoError as e:
        logger.error(f"Database error in get_sessions: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.get("/sessions/{session_id}", summary="Get session details")
async def get_session(session_id: str):
    """
    Get detailed information about a specific session.
    """
    try:
        session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except PyMongoError as e:
        logger.error(f"Database error in get_session: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ==================== BOOKING ROUTES ====================

@api_router.post("/bookings", summary="Create a new booking")
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Book a session for the current user.
    
    Requires valid JWT token and available session.
    """
    try:
        # Get session
        session = await db.sessions.find_one({"id": booking_data.session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check availability
        if not session.get('available', False):
            raise HTTPException(status_code=400, detail="Session is not available")
        
        if session['current_bookings'] >= session['max_students']:
            raise HTTPException(status_code=400, detail="Session is fully booked")
        
        # Check if user already booked this session
        existing_booking = await db.bookings.find_one({
            "user_id": current_user.id,
            "session_id": booking_data.session_id,
            "status": {"$ne": BookingStatus.CANCELLED}
        })
        if existing_booking:
            raise HTTPException(status_code=400, detail="You have already booked this session")
        
        # Create booking
        booking = Booking(
            user_id=current_user.id,
            session_id=booking_data.session_id,
            amount=session['price'],
            student_notes=booking_data.student_notes
        )
        
        await db.bookings.insert_one(booking.model_dump())
        
        # Update session booking count
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
        
        return {
            "message": "Booking created successfully",
            "booking": booking.model_dump()
        }
    except PyMongoError as e:
        logger.error(f"Database error in create_booking: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.get("/bookings/my-bookings", summary="Get user's bookings")
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    """
    Get all bookings for the current user.
    
    Returns bookings with session details.
    """
    try:
        bookings = await db.bookings.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
        
        # Enrich with session data
        enriched_bookings = []
        for booking in bookings:
            session = await db.sessions.find_one({"id": booking['session_id']}, {"_id": 0})
            enriched_bookings.append({
                **booking,
                "session": session
            })
        
        return sorted(enriched_bookings, key=lambda x: x['created_at'], reverse=True)
    except PyMongoError as e:
        logger.error(f"Database error in get_my_bookings: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.put("/bookings/{booking_id}/cancel", summary="Cancel a booking")
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a booking and free up the session spot.
    
    Only the booking owner can cancel.
    """
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking['status'] == BookingStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Booking already cancelled")
        
        # Update booking status
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": BookingStatus.CANCELLED}}
        )
        
        # Update session availability
        session = await db.sessions.find_one({"id": booking['session_id']})
        if session:
            new_count = max(0, session['current_bookings'] - 1)
            await db.sessions.update_one(
                {"id": booking['session_id']},
                {
                    "$set": {
                        "current_bookings": new_count,
                        "available": True
                    }
                }
            )
        
        return {"message": "Booking cancelled successfully"}
    except PyMongoError as e:
        logger.error(f"Database error in cancel_booking: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.get("/bookings/{booking_id}", summary="Get booking details")
async def get_booking_by_id(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific booking.
    
    Only the booking owner can view.
    """
    try:
        # Get booking
        booking = await db.bookings.find_one(
            {"id": booking_id, "user_id": current_user.id},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get session details
        session = await db.sessions.find_one(
            {"id": booking['session_id']}, 
            {"_id": 0}
        )
        
        return {
            **booking,
            "session": session
        }
        
    except PyMongoError as e:
        logger.error(f"Database error in get_booking_by_id: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error in get_booking_by_id: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== PAYMENT ROUTES ====================

def generate_payfast_signature(data: dict, passphrase: str = '') -> str:
    """
    Generate PayFast signature according to their documentation
    """
    # Filter out empty values
    data = {k: v for k, v in data.items() if v not in [None, '']}
    
    # Create parameter string
    param_string_parts = []
    for key in sorted(data.keys()):
        if data[key] not in [None, '']:
            # URL encode the value - PayFast requires specific encoding
            value = str(data[key])
            encoded_value = urllib.parse.quote_plus(value.encode('utf-8'))
            param_string_parts.append(f"{key}={encoded_value}")
    
    param_string = '&'.join(param_string_parts)
    
    # Add passphrase if provided
    if passphrase and passphrase.strip():
        # Passphrase should be URL encoded and appended
        encoded_passphrase = urllib.parse.quote_plus(passphrase.strip().encode('utf-8'))
        param_string = f"{param_string}&passphrase={encoded_passphrase}"
    
    # Generate MD5 hash
    signature = hashlib.md5(param_string.encode()).hexdigest()
    return signature

@api_router.post("/payments/initiate/{booking_id}", summary="Initiate PayFast payment")
async def initiate_payment(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Generate PayFast payment data for a booking.
    
    Returns payment URL and data for redirecting to PayFast.
    """
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking['payment_status'] == PaymentStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Payment already completed")
        
        # Get session details
        session = await db.sessions.find_one({"id": booking['session_id']})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Generate unique payment ID
        payment_id = str(uuid.uuid4())
        
        # Prepare PayFast data
        amount_in_rand = booking['amount'] / 100.0
        
        data = {
            'merchant_id': PAYFAST_MERCHANT_ID,
            'merchant_key': PAYFAST_MERCHANT_KEY,
            'return_url': PAYFAST_RETURN_URL,
            'cancel_url': PAYFAST_CANCEL_URL,
            'notify_url': PAYFAST_NOTIFY_URL,
            'name_first': current_user.full_name.split()[0] if current_user.full_name else '',
            'name_last': current_user.full_name.split()[-1] if current_user.full_name else '',
            'email_address': current_user.email,
            'm_payment_id': payment_id,
            'amount': f"{amount_in_rand:.2f}",
            'item_name': f"{session['subject']} - {session['session_type'].replace('_', ' ').title()} Session",
            'item_description': f"Session on {session['date']} at {session['start_time']}",
            'custom_str1': booking_id,
            'custom_str2': current_user.id,
        }
        
        # Log the data being sent
        logger.info("=== PAYFAST REQUEST DATA ===")
        for key, value in data.items():
            logger.info(f"{key}: {value}")
        
        # Generate signature
        signature = generate_payfast_signature(data, PAYFAST_PASSPHRASE)
        data['signature'] = signature
        
        logger.info(f"Generated signature: {signature}")
        logger.info(f"Payment URL: {PAYFAST_URL}")
        logger.info(f"Return URL: {PAYFAST_RETURN_URL}")
        logger.info(f"Cancel URL: {PAYFAST_CANCEL_URL}")
        logger.info("============================")
        
        # Create payment record in database
        payment = Payment(
            id=payment_id,
            booking_id=booking_id,
            amount=booking['amount'],
            payment_method="payfast"
        )
        
        await db.payments.insert_one(payment.model_dump())
        
        return {
            "payment_id": payment_id,
            "payment_url": PAYFAST_URL,  # This is the PayFast URL
            "payment_data": data
        }
    except PyMongoError as e:
        logger.error(f"Database error in initiate_payment: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error in initiate_payment: {e}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")

@api_router.post("/payments/itn", summary="PayFast ITN Callback")
async def payfast_itn(
    background_tasks: BackgroundTasks,
    m_payment_id: Optional[str] = Form(None),
    pf_payment_id: Optional[str] = Form(None),
    payment_status: Optional[str] = Form(None),
    item_name: Optional[str] = Form(None),
    amount_gross: Optional[str] = Form(None),
    amount_fee: Optional[str] = Form(None),
    amount_net: Optional[str] = Form(None),
    custom_str1: Optional[str] = Form(None),
    custom_str2: Optional[str] = Form(None),
    signature: Optional[str] = Form(None)
):
    """
    Handle PayFast Instant Transaction Notification (ITN).
    
    This endpoint receives payment notifications from PayFast.
    It verifies the signature and updates the payment/booking status.
    
    Note: PayFast sends data as form/multipart data.
    """
    try:
        # Collect all form data into a dictionary
        data = {
            'm_payment_id': m_payment_id,
            'pf_payment_id': pf_payment_id,
            'payment_status': payment_status,
            'item_name': item_name,
            'amount_gross': amount_gross,
            'amount_fee': amount_fee,
            'amount_net': amount_net,
            'custom_str1': custom_str1,
            'custom_str2': custom_str2,
            'signature': signature
        }
        
        # Log received data
        logger.info("=== PAYFAST ITN RECEIVED ===")
        for key, value in data.items():
            if value:  # Only log non-empty values
                logger.info(f"{key}: {value}")
        
        # Get signature from data
        received_signature = data.get('signature')
        
        if not received_signature:
            logger.error("❌ No signature provided in ITN!")
            raise HTTPException(status_code=400, detail="No signature provided")
        
        # Create data for signature verification (exclude signature itself)
        data_for_signature = {k: v for k, v in data.items() if k != 'signature' and v is not None}
        
        # Generate signature for verification
        calculated_signature = generate_payfast_signature(data_for_signature, PAYFAST_PASSPHRASE)
        
        logger.info(f"Calculated signature: {calculated_signature}")
        logger.info(f"Received signature: {received_signature}")
        logger.info("============================")
        
        # Skip signature validation in sandbox mode for testing
        # In production, always validate
        if PAYFAST_ENV != 'sandbox':
            if calculated_signature != received_signature:
                logger.error("❌ SIGNATURE MISMATCH!")
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            logger.info("⚠️ Skipping signature validation (sandbox mode)")
        
        # Get booking ID from custom data
        booking_id = data.get('custom_str1')
        payment_status_value = data.get('payment_status')
        
        if not booking_id:
            logger.error("❌ No booking ID in ITN data!")
            raise HTTPException(status_code=400, detail="No booking ID provided")
        
        if not payment_status_value:
            logger.error("❌ No payment status in ITN data!")
            raise HTTPException(status_code=400, detail="No payment status provided")
        
        # Update payment status
        payment_status_enum = PaymentStatus.COMPLETED if payment_status_value == 'COMPLETE' else PaymentStatus.FAILED
        
        # Find payment by m_payment_id
        payment = await db.payments.find_one({"id": data.get('m_payment_id')})
        if payment:
            await db.payments.update_one(
                {"id": data.get('m_payment_id')},
                {"$set": {
                    "status": payment_status_enum,
                    "pf_payment_id": pf_payment_id,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            logger.info(f"✅ Updated payment record: {data.get('m_payment_id')}")
        else:
            logger.warning(f"⚠️ Payment record not found: {data.get('m_payment_id')}")
        
        # Update booking status
        if payment_status_enum == PaymentStatus.COMPLETED:
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "payment_status": PaymentStatus.COMPLETED,
                    "status": BookingStatus.CONFIRMED
                }}
            )
            logger.info(f"✅ Payment completed for booking {booking_id}")
            
            # Get booking details for notifications
            booking = await db.bookings.find_one({"id": booking_id})
            if booking:
                # Get user details
                user = await db.users.find_one({"id": booking['user_id']})
                if user:
                    # Get session details
                    session = await db.sessions.find_one({"id": booking['session_id']})
                    if session:
                        # Add notification task to background
                        background_tasks.add_task(
                            send_session_confirmation_notifications,
                            booking_id=booking_id,
                            user_email=user['email'],
                            user_phone=user['phone'],
                            user_name=user['full_name'],
                            session_details=session,
                            booking_details=booking
                        )
                        logger.info(f"✅ Notification task added for booking {booking_id}")
                    
        else:
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "payment_status": PaymentStatus.FAILED
                }}
            )
            logger.info(f"❌ Payment failed for booking {booking_id}")
        
        return {"status": "success"}
        
    except PyMongoError as e:
        logger.error(f"Database error in payfast_itn: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error in payfast_itn: {e}")
        raise HTTPException(status_code=500, detail=f"ITN processing failed: {str(e)}")

@api_router.get("/payments/verify/{payment_id}", summary="Verify payment status")
async def verify_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """
    Check the status of a payment.
    
    Only the payment owner can verify.
    """
    try:
        payment = await db.payments.find_one({"id": payment_id})
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Get booking to check ownership
        booking = await db.bookings.find_one({"id": payment['booking_id'], "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return {
            "status": payment['status'],
            "booking_id": payment['booking_id'],
            "amount": payment['amount']
        }
    except PyMongoError as e:
        logger.error(f"Database error in verify_payment: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@api_router.get("/payments/booking/{booking_id}", summary="Get payment for booking")
async def get_payment_for_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    """
    Get payment information for a specific booking.
    
    Only the booking owner can view.
    """
    try:
        # Check if booking belongs to user
        booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get payment
        payment = await db.payments.find_one({"booking_id": booking_id}, {"_id": 0})
        
        return {
            "booking": booking,
            "payment": payment
        }
    except PyMongoError as e:
        logger.error(f"Database error in get_payment_for_booking: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    
    
# ==================== DELETE BOOKING ====================

@api_router.delete("/bookings/{booking_id}", summary="Delete a cancelled booking")
async def delete_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Permanently delete a cancelled booking.
    
    Rules:
    1. Only booking owner can delete
    2. Only cancelled bookings can be deleted
    3. Active bookings must be cancelled first
    """
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Only allow deletion of cancelled bookings
        if booking['status'] != BookingStatus.CANCELLED:
            raise HTTPException(
                status_code=400, 
                detail="You can only delete cancelled bookings. Please cancel it first."
            )
        
        # Get session to update availability
        session = await db.sessions.find_one({"id": booking['session_id']})
        
        # Delete the booking
        result = await db.bookings.delete_one({"id": booking_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete booking")
        
        # Also delete associated payment if exists
        await db.payments.delete_one({"booking_id": booking_id})
        
        # If session exists, update its availability
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
            logger.info(f"✅ Updated session availability for {booking['session_id']}")
        
        logger.info(f"✅ Booking {booking_id} deleted by user {current_user.id}")
        
        return {
            "message": "Booking deleted successfully",
            "session_updated": session is not None
        }
        
    except PyMongoError as e:
        logger.error(f"Database error in delete_booking: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats", summary="Get user dashboard statistics")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """
    Get statistics for the user's dashboard.
    
    Returns counts of bookings, confirmed sessions, and upcoming sessions.
    """
    try:
        # Get user's bookings
        total_bookings = await db.bookings.count_documents({"user_id": current_user.id})
        confirmed_bookings = await db.bookings.count_documents({
            "user_id": current_user.id,
            "status": BookingStatus.CONFIRMED
        })
        
        # Get upcoming sessions
        upcoming = await db.bookings.find(
            {"user_id": current_user.id, "status": BookingStatus.CONFIRMED},
            {"_id": 0}
        ).to_list(10)
        
        return {
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "upcoming_sessions": len(upcoming)
        }
    except PyMongoError as e:
        logger.error(f"Database error in get_dashboard_stats: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ==================== SEED DATA ====================

@api_router.post("/seed-sessions", summary="Seed sample sessions")
async def seed_sessions():
    """
    Create sample sessions for testing.
    
    Creates group sessions (Sundays) and 1-on-1 sessions (weekdays).
    """
    try:
        # Clear existing sessions
        await db.sessions.delete_many({})
        
        sessions = []
        today = datetime.now()
        
        # Group sessions (Sundays) - Next 4 weeks
        for week in range(4):
            # Get next Sunday
            days_ahead = 6 - today.weekday() + (week * 7)  # 6 = Sunday
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            date = today + timedelta(days=days_ahead)
            date_str = date.strftime('%Y-%m-%d')
            
            # Maths Group Class
            sessions.append(Session(
                session_type=SessionType.GROUP,
                subject=Subject.MATHS,
                date=date_str,
                start_time="09:00",
                duration_minutes=90,
                price=500,
                max_students=10
            ).model_dump())
            
            # Physical Sciences Group Class
            sessions.append(Session(
                session_type=SessionType.GROUP,
                subject=Subject.PHYSICAL_SCIENCES,
                date=date_str,
                start_time="11:00",
                duration_minutes=90,
                price=500,
                max_students=10
            ).model_dump())
        
        # 1-on-1 sessions (Weekdays) - Next 2 weeks
        for day in range(1, 15):
            date = today + timedelta(days=day)
            if date.weekday() < 5:  # Monday to Friday
                date_str = date.strftime('%Y-%m-%d')
                
                for subject in [Subject.MATHS, Subject.PHYSICAL_SCIENCES]:
                    for time in ["14:00", "16:00", "18:00"]:
                        sessions.append(Session(
                            session_type=SessionType.ONE_ON_ONE,
                            subject=subject,
                            date=date_str,
                            start_time=time,
                            duration_minutes=90,
                            price=200,
                            max_students=1
                        ).model_dump())
        
        await db.sessions.insert_many(sessions)
        
        return {
            "message": "Sessions seeded successfully",
            "count": len(sessions)
        }
    except PyMongoError as e:
        logger.error(f"Database error in seed_sessions: {e}")
        raise HTTPException(status_code=500, detail="Database error")


# ==================== TEST NOTIFICATIONS ====================

@api_router.post("/test-notifications/{booking_id}", summary="Test notifications")
async def test_notifications(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Test email and WhatsApp notifications for a booking.
    
    Only for testing purposes.
    """
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get session
        session = await db.sessions.find_one({"id": booking['session_id']})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Send test notifications
        await send_session_confirmation_notifications(
            booking_id=booking_id,
            user_email=current_user.email,
            user_phone=current_user.phone,
            user_name=current_user.full_name,
            session_details=session,
            booking_details=booking
        )
        
        return {
            "message": "Test notifications sent successfully",
            "email_sent": EMAIL_ENABLED,
            "whatsapp_sent": WHATSAPP_ENABLED
        }
        
    except Exception as e:
        logger.error(f"Error in test_notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Add a simple health check endpoint
@app.get("/health", summary="Health check")
async def health_check():
    """
    Check if the API is running.
    """
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# OPTIONS method handler for preflight requests
@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "CORS preflight request handled"}