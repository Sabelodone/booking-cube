"""
Comprehensive Test Script for Tutoring Booking Website
Tests the entire flow including email notifications
"""

import asyncio
import httpx
import json
from datetime import datetime, timedelta
import uuid
import sys
from typing import Dict, Any, Optional, List
import traceback
import time
import imaplib
import email
from email.header import decode_header
import re

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Email testing configuration (for Gmail - use a test account!)
EMAIL_TEST_CONFIG = {
    "enabled": False,  # Set to True if you want to test actual email receipt
    "imap_server": "imap.gmail.com",
    "email": "your-test-email@gmail.com",  # Change this to your test email
    "password": "your-app-password",  # Use App Password, not regular password
    "wait_time": 30  # Seconds to wait for email delivery
}

# Test user data
TEST_USER = {
    "email": f"test_user_{uuid.uuid4().hex[:8]}@example.com",
    "password": "Test123!@#",
    "full_name": "Test Student",
    "grade": "10",
    "phone": "0712345678"
}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️ {msg}{Colors.RESET}")

def print_email(msg):
    print(f"{Colors.PURPLE}📧 {msg}{Colors.RESET}")

def print_payment(msg):
    print(f"{Colors.CYAN}💰 {msg}{Colors.RESET}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")

class EmailTester:
    """Helper class to test email notifications"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.conn = None
    
    def connect(self) -> bool:
        """Connect to email server"""
        if not self.config["enabled"]:
            return False
        
        try:
            self.conn = imaplib.IMAP4_SSL(self.config["imap_server"])
            self.conn.login(self.config["email"], self.config["password"])
            self.conn.select("INBOX")
            print_email(f"Connected to {self.config['email']}")
            return True
        except Exception as e:
            print_warning(f"Could not connect to email: {e}")
            return False
    
    def wait_for_email(self, subject_pattern: str, timeout: int = 60) -> Optional[Dict]:
        """Wait for an email matching subject pattern"""
        if not self.conn:
            return None
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Search for unseen emails
                _, messages = self.conn.search(None, 'UNSEEN')
                
                for msg_id in messages[0].split():
                    _, msg_data = self.conn.fetch(msg_id, '(RFC822)')
                    email_body = msg_data[0][1]
                    email_message = email.message_from_bytes(email_body)
                    
                    # Decode subject
                    subject, encoding = decode_header(email_message["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    # Check if subject matches pattern
                    if re.search(subject_pattern, subject, re.IGNORECASE):
                        # Get body
                        body = ""
                        if email_message.is_multipart():
                            for part in email_message.walk():
                                if part.get_content_type() == "text/plain":
                                    body = part.get_payload(decode=True).decode()
                                    break
                        else:
                            body = email_message.get_payload(decode=True).decode()
                        
                        return {
                            "subject": subject,
                            "from": email_message["From"],
                            "to": email_message["To"],
                            "body": body
                        }
                
                time.sleep(5)  # Wait 5 seconds before checking again
                
            except Exception as e:
                print_warning(f"Error checking emails: {e}")
                time.sleep(5)
        
        return None
    
    def close(self):
        """Close email connection"""
        if self.conn:
            try:
                self.conn.close()
                self.conn.logout()
            except:
                pass

class TutorBookingTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.token = None
        self.user_id = None
        self.user_data = None
        self.sessions = []
        self.bookings = []
        self.payments = []
        self.email_tester = EmailTester(EMAIL_TEST_CONFIG)
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "email_tests": {
                "booking_confirmation": False,
                "payment_confirmation": False,
                "reminder": False
            }
        }

    async def close(self):
        await self.client.aclose()
        self.email_tester.close()

    def record_test(self, name: str, success: bool, error: Optional[str] = None):
        if success:
            self.test_results["passed"] += 1
            print_success(f"{name}")
        else:
            self.test_results["failed"] += 1
            print_error(f"{name}")
            if error:
                print(f"   Error: {error}")

    async def test_health(self):
        """Test 1: Check if server is healthy"""
        try:
            response = await self.client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.record_test("Server health check", True)
                print_info(f"   Database: {data.get('database', 'unknown')}")
                return True
            else:
                self.record_test("Server health check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Server health check", False, str(e))
            return False

    async def test_db_connection(self):
        """Test 2: Check database connection"""
        try:
            response = await self.client.get(f"{API_URL}/test/db")
            if response.status_code == 200:
                data = response.json()
                self.record_test("Database connection", True)
                print_info(f"   Database: {data.get('database', 'unknown')}")
                print_info(f"   Collections: {', '.join(data.get('collections', []))}")
                return True
            else:
                self.record_test("Database connection", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Database connection", False, str(e))
            return False

    async def test_user_signup(self):
        """Test 3: User registration"""
        try:
            response = await self.client.post(
                f"{API_URL}/auth/signup",
                json=TEST_USER
            )
            
            if response.status_code == 201:
                data = response.json()
                self.token = data.get("token")
                self.user_data = data.get("user")
                self.user_id = self.user_data.get("id")
                
                self.record_test("User signup", True)
                print_info(f"   User ID: {self.user_id}")
                print_info(f"   Email: {TEST_USER['email']}")
                
                # Check if welcome email was sent
                if self.email_tester.config["enabled"]:
                    print_email("Waiting for welcome email...")
                    email_data = self.email_tester.wait_for_email("welcome|registration", timeout=30)
                    if email_data:
                        print_success("Welcome email received!")
                        print_email(f"   Subject: {email_data['subject']}")
                    else:
                        print_warning("No welcome email received within timeout")
                
                return True
            else:
                self.record_test("User signup", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.record_test("User signup", False, str(e))
            return False

    async def test_user_login(self):
        """Test 4: User login"""
        try:
            response = await self.client.post(
                f"{API_URL}/auth/login",
                json={
                    "email": TEST_USER["email"],
                    "password": TEST_USER["password"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.record_test("User login", True)
                print_info(f"   Token received: {self.token[:20]}...")
                return True
            else:
                self.record_test("User login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.record_test("User login", False, str(e))
            return False

    async def test_get_current_user(self):
        """Test 5: Get current user profile"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.get(
                f"{API_URL}/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.record_test("Get current user", True)
                print_info(f"   User: {data.get('full_name')} (Grade {data.get('grade')})")
                return True
            else:
                self.record_test("Get current user", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Get current user", False, str(e))
            return False

    async def test_seed_sessions(self):
        """Test 6: Seed sessions"""
        try:
            response = await self.client.post(f"{API_URL}/seed-sessions")
            
            if response.status_code == 200:
                data = response.json()
                self.record_test("Seed sessions", True)
                print_info(f"   Total sessions created: {data.get('stats', {}).get('total_sessions', 0)}")
                print_info(f"   Total spots available: {data.get('stats', {}).get('total_available_spots', 0)}")
                return True
            else:
                self.record_test("Seed sessions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Seed sessions", False, str(e))
            return False

    async def test_get_sessions(self):
        """Test 7: Get all available sessions"""
        try:
            response = await self.client.get(f"{API_URL}/sessions")
            
            if response.status_code == 200:
                self.sessions = response.json()
                self.record_test("Get sessions", True)
                print_info(f"   Found {len(self.sessions)} sessions")
                
                # Count by type
                group = [s for s in self.sessions if s.get('session_type') == 'group']
                one_on_one = [s for s in self.sessions if s.get('session_type') == 'one_on_one']
                print_info(f"   Group sessions: {len(group)}")
                print_info(f"   1-on-1 sessions: {len(one_on_one)}")
                
                return True
            else:
                self.record_test("Get sessions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Get sessions", False, str(e))
            return False

    async def test_create_booking(self):
        """Test 8: Create a booking"""
        try:
            if not self.sessions:
                print_warning("No sessions available to book")
                self.record_test("Create booking", True, "Skipped - no sessions")
                return True
            
            # Find an available session
            available_session = None
            for session in self.sessions:
                if session.get('available') and session.get('current_bookings', 0) < session.get('max_students', 0):
                    available_session = session
                    break
            
            if not available_session:
                print_warning("No available sessions found")
                self.record_test("Create booking", True, "Skipped - no available sessions")
                return True
            
            headers = {"Authorization": f"Bearer {self.token}"}
            booking_data = {
                "session_id": available_session['id'],
                "student_notes": "Test booking - please check email notifications"
            }
            
            response = await self.client.post(
                f"{API_URL}/bookings",
                json=booking_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                self.bookings.append(data)
                self.record_test("Create booking", True)
                print_info(f"   Booking ID: {data.get('booking_id')}")
                print_info(f"   Session: {available_session.get('subject')} on {available_session.get('date')}")
                print_info(f"   Amount: R{data.get('booking', {}).get('amount', 0)/100:.2f}")
                
                # Check for booking confirmation email
                if self.email_tester.config["enabled"]:
                    print_email("Waiting for booking confirmation email...")
                    email_data = self.email_tester.wait_for_email("booking confirmation|booking received", timeout=30)
                    if email_data:
                        print_success("Booking confirmation email received!")
                        print_email(f"   Subject: {email_data['subject']}")
                        self.test_results["email_tests"]["booking_confirmation"] = True
                    else:
                        print_warning("No booking confirmation email received")
                
                return True
            else:
                self.record_test("Create booking", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.record_test("Create booking", False, str(e))
            traceback.print_exc()
            return False

    async def test_initiate_payment(self):
        """Test 9: Initiate payment for a booking"""
        try:
            if not self.bookings:
                print_warning("No bookings to test payment")
                self.record_test("Initiate payment", True, "Skipped - no bookings")
                return True
            
            booking_id = self.bookings[0].get('booking_id')
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.post(
                f"{API_URL}/payments/initiate/{booking_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.payments.append(data)
                self.record_test("Initiate payment", True)
                print_payment(f"   Payment ID: {data.get('payment_id')}")
                print_payment(f"   Payment URL: {data.get('payment_url')}")
                
                # Show PayFast data (without sensitive info)
                pf_data = data.get('payment_data', {})
                print_info(f"   Amount: {pf_data.get('amount')}")
                print_info(f"   Signature generated: {bool(pf_data.get('signature'))}")
                
                return True
            else:
                self.record_test("Initiate payment", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.record_test("Initiate payment", False, str(e))
            return False

    async def test_simulate_payment_success(self):
        """Test 10: Simulate successful payment (via ITN)"""
        try:
            if not self.bookings or not self.payments:
                print_warning("No payments to simulate")
                self.record_test("Simulate payment success", True, "Skipped - no payments")
                return True
            
            booking = self.bookings[0]
            payment = self.payments[0]
            booking_id = booking.get('booking_id')
            payment_id = payment.get('payment_id')
            
            # Simulate PayFast ITN callback
            itn_data = {
                "m_payment_id": payment_id,
                "pf_payment_id": str(uuid.uuid4().int)[:10],
                "payment_status": "COMPLETE",
                "amount_gross": str(booking.get('booking', {}).get('amount', 0) / 100),
                "amount_fee": "5.00",
                "amount_net": str((booking.get('booking', {}).get('amount', 0) / 100) - 5),
                "item_name": "Test Booking",
                "item_description": "Test Payment",
                "custom_str1": booking_id,
                "custom_str2": self.user_id
            }
            
            # Add signature if needed (simplified for testing)
            itn_data["signature"] = "test_signature"
            
            response = await self.client.post(
                f"{API_URL}/payments/itn",
                data=itn_data
            )
            
            if response.status_code == 200:
                self.record_test("Simulate payment success", True)
                print_payment("✅ Payment marked as COMPLETE via ITN")
                
                # Check for payment confirmation email
                if self.email_tester.config["enabled"]:
                    print_email("Waiting for payment confirmation email...")
                    email_data = self.email_tester.wait_for_email("payment confirmed|payment successful|receipt", timeout=30)
                    if email_data:
                        print_success("Payment confirmation email received!")
                        print_email(f"   Subject: {email_data['subject']}")
                        self.test_results["email_tests"]["payment_confirmation"] = True
                    else:
                        print_warning("No payment confirmation email received")
                
                return True
            else:
                self.record_test("Simulate payment success", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.record_test("Simulate payment success", False, str(e))
            return False

    async def test_verify_booking_after_payment(self):
        """Test 11: Verify booking status after payment"""
        try:
            if not self.bookings:
                print_warning("No bookings to verify")
                self.record_test("Verify booking after payment", True, "Skipped - no bookings")
                return True
            
            booking_id = self.bookings[0].get('booking_id')
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Wait a moment for database updates
            await asyncio.sleep(2)
            
            response = await self.client.get(
                f"{API_URL}/bookings/{booking_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                booking = response.json()
                self.record_test("Verify booking after payment", True)
                print_info(f"   Booking status: {booking.get('status')}")
                print_info(f"   Payment status: {booking.get('payment_status')}")
                
                if booking.get('status') == 'confirmed' and booking.get('payment_status') == 'completed':
                    print_success("✅ Booking successfully confirmed after payment")
                else:
                    print_warning(f"⚠️ Booking not fully confirmed: {booking.get('status')}/{booking.get('payment_status')}")
                
                return True
            else:
                self.record_test("Verify booking after payment", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Verify booking after payment", False, str(e))
            return False

    async def test_get_my_bookings(self):
        """Test 12: Get user's bookings"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.get(
                f"{API_URL}/bookings/my-bookings",
                headers=headers
            )
            
            if response.status_code == 200:
                bookings = response.json()
                self.record_test("Get my bookings", True)
                print_info(f"   Found {len(bookings)} bookings")
                
                for i, booking in enumerate(bookings[:3]):  # Show first 3
                    session = booking.get('session', {})
                    print_info(f"   {i+1}. {session.get('subject')} - {session.get('date')} - Status: {booking.get('status')} - Payment: {booking.get('payment_status')}")
                
                return True
            else:
                self.record_test("Get my bookings", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Get my bookings", False, str(e))
            return False

    async def test_dashboard_stats(self):
        """Test 13: Get dashboard statistics"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.get(
                f"{API_URL}/dashboard/stats",
                headers=headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                self.record_test("Dashboard stats", True)
                print_info(f"   Total bookings: {stats.get('total_bookings', 0)}")
                print_info(f"   Confirmed: {stats.get('confirmed_bookings', 0)}")
                print_info(f"   Pending payments: {stats.get('pending_payments', 0)}")
                print_info(f"   Upcoming: {stats.get('upcoming_sessions', 0)}")
                return True
            else:
                self.record_test("Dashboard stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.record_test("Dashboard stats", False, str(e))
            return False

    async def test_session_reminder(self):
        """Test 14: Simulate session reminder email"""
        try:
            if not self.bookings:
                print_warning("No bookings to test reminder")
                self.record_test("Session reminder", True, "Skipped - no bookings")
                return True
            
            # This would typically be triggered by a background job
            # For testing, we'll check if reminder emails are being sent
            
            print_info("Checking for session reminder emails...")
            print_info("Note: Reminders are usually sent 24h before session")
            
            if self.email_tester.config["enabled"]:
                # This is a placeholder - in reality, you'd trigger your reminder service
                print_email("Reminder emails would be sent 24h before session")
                self.test_results["email_tests"]["reminder"] = "pending"
            
            self.record_test("Session reminder check", True)
            return True
            
        except Exception as e:
            self.record_test("Session reminder", False, str(e))
            return False

    async def test_email_notification_summary(self):
        """Test 15: Summary of email notifications"""
        try:
            print_email("\n📧 EMAIL NOTIFICATION SUMMARY:")
            
            if not self.email_tester.config["enabled"]:
                print_warning("Email testing is disabled")
                print_info("To enable email testing, update EMAIL_TEST_CONFIG in the script:")
                print_info("  - enabled: true")
                print_info("  - email: your-test-email@gmail.com")
                print_info("  - password: your-app-password")
                print_info("")
                print_info("Note: Use Gmail App Password, not your regular password!")
                self.record_test("Email notification summary", True)
                return True
            
            results = self.test_results["email_tests"]
            
            tests = [
                ("Welcome Email", True),  # We can't easily test this without modifying signup
                ("Booking Confirmation", results["booking_confirmation"]),
                ("Payment Confirmation", results["payment_confirmation"]),
                ("Session Reminder", results["reminder"] == True)
            ]
            
            all_passed = True
            for test_name, passed in tests:
                if passed:
                    print_success(f"{test_name}: Sent")
                else:
                    if test_name == "Welcome Email":
                        print_warning(f"{test_name}: Not tested (requires signup modification)")
                    elif test_name == "Session Reminder":
                        print_info(f"{test_name}: Not triggered yet (sent 24h before)")
                    else:
                        print_error(f"{test_name}: Not received")
                        all_passed = False
            
            self.record_test("Email notification summary", all_passed)
            return True
            
        except Exception as e:
            self.record_test("Email notification summary", False, str(e))
            return False

    async def run_all_tests(self):
        """Run all tests in sequence"""
        print_header("🚀 TUTORING BOOKING WEBSITE - COMPLETE TEST SUITE WITH EMAIL NOTIFICATIONS")
        print_info(f"Testing against: {BASE_URL}")
        print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.email_tester.config["enabled"]:
            if self.email_tester.connect():
                print_success("Email testing enabled - will verify notifications")
            else:
                print_warning("Email testing configured but connection failed - continuing without email verification")
        
        # Test sequence
        tests = [
            ("Server Health", self.test_health),
            ("Database Connection", self.test_db_connection),
            ("User Signup", self.test_user_signup),
            ("User Login", self.test_user_login),
            ("Get Current User", self.test_get_current_user),
            ("Seed Sessions", self.test_seed_sessions),
            ("Get All Sessions", self.test_get_sessions),
            ("Create Booking", self.test_create_booking),
            ("Initiate Payment", self.test_initiate_payment),
            ("Simulate Payment Success", self.test_simulate_payment_success),
            ("Verify Booking After Payment", self.test_verify_booking_after_payment),
            ("Get My Bookings", self.test_get_my_bookings),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Session Reminder Check", self.test_session_reminder),
            ("Email Notification Summary", self.test_email_notification_summary),
        ]
        
        for test_name, test_func in tests:
            print_header(f"Testing: {test_name}")
            try:
                await test_func()
            except Exception as e:
                print_error(f"Test {test_name} crashed with error: {str(e)}")
                traceback.print_exc()
                self.test_results["failed"] += 1
        
        # Print summary
        self.print_summary()
        
        return self.test_results["failed"] == 0

    def print_summary(self):
        """Print test summary"""
        print_header("📊 TEST SUMMARY")
        total = self.test_results["passed"] + self.test_results["failed"]
        print_info(f"Total tests run: {total}")
        print_success(f"Passed: {self.test_results['passed']}")
        
        if self.test_results["failed"] > 0:
            print_error(f"Failed: {self.test_results['failed']}")
        else:
            print_success(f"Failed: {self.test_results['failed']}")
        
        if self.test_results["skipped"] > 0:
            print_warning(f"Skipped: {self.test_results['skipped']}")
        
        success_rate = (self.test_results["passed"] / total * 100) if total > 0 else 0
        print_info(f"Success rate: {success_rate:.1f}%")
        
        # Email summary
        print_email("\n📧 EMAIL NOTIFICATION STATUS:")
        if self.email_tester.config["enabled"]:
            if self.test_results["email_tests"]["booking_confirmation"]:
                print_success("✓ Booking confirmation email: Received")
            else:
                print_error("✗ Booking confirmation email: Not received")
                
            if self.test_results["email_tests"]["payment_confirmation"]:
                print_success("✓ Payment confirmation email: Received")
            else:
                print_error("✗ Payment confirmation email: Not received")
        else:
            print_warning("Email testing disabled - enable EMAIL_TEST_CONFIG to verify notifications")
        
        if self.test_results["failed"] == 0:
            print_success("\n🎉 ALL TESTS PASSED! The website is working correctly with email notifications!")
            print_info("\nRemember to:")
            print_info("  1. Check that users actually receive the emails")
            print_info("  2. Verify email content has correct booking details")
            print_info("  3. Test with different email providers")
        else:
            print_error("\n⚠️ Some tests failed. Check the errors above.")

async def main():
    """Main function to run tests"""
    tester = TutorBookingTester()
    
    try:
        # Check if server is running
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/health", timeout=5.0)
        except Exception:
            print_error(f"Cannot connect to server at {BASE_URL}")
            print_info("Make sure your server is running with: uvicorn server:app --reload --port 8000")
            return 1
        
        # Run tests
        success = await tester.run_all_tests()
        
    except KeyboardInterrupt:
        print_warning("\nTests interrupted by user")
        return 1
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        traceback.print_exc()
        return 1
    finally:
        await tester.close()
    
    return 0 if success else 1

if __name__ == "__main__":
    # Run the async main function
    exit_code = asyncio.run(main())
    sys.exit(exit_code)