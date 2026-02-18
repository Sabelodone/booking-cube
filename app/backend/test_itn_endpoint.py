import requests
import json
import uuid
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Sabelo's email for testing
SABELO_EMAIL = "sabelozondo825@gmail.com"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.PURPLE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.PURPLE}  {text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.PURPLE}{'='*60}{Colors.RESET}")

def print_subheader(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}--- {text} ---{Colors.RESET}")

def print_test(name, status, data=None, error=None):
    status_symbol = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if status else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status_symbol} {name}")
    if data:
        print(f"   {Colors.YELLOW}Response:{Colors.RESET} {json.dumps(data, indent=2)[:200]}..." + (" (truncated)" if len(json.dumps(data)) > 200 else ""))
    if error:
        print(f"   {Colors.RED}Error: {error}{Colors.RESET}")

def verify_sabelo_login(email, password):
    """Verify login credentials for Sabelo"""
    try:
        login_data = {"email": email, "password": password}
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            return True, response.json().get('token')
        else:
            return False, None
    except Exception as e:
        return False, None

def run_tests():
    print_header("🚀 COMPREHENSIVE API TESTING SUITE")
    print(f"Base URL: {API_URL}")
    print(f"Testing with email: {Colors.CYAN}{SABELO_EMAIL}{Colors.RESET}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get password for Sabelo
    import getpass
    max_attempts = 3
    sabelo_token = None
    
    for attempt in range(max_attempts):
        password = getpass.getpass(f"\nEnter password for {SABELO_EMAIL} (attempt {attempt + 1}/{max_attempts}): ")
        print(f"\n{Colors.YELLOW}🔐 Verifying login credentials...{Colors.RESET}")
        
        valid, token = verify_sabelo_login(SABELO_EMAIL, password)
        if valid:
            sabelo_token = token
            print(f"{Colors.GREEN}✅ Login successful!{Colors.RESET}")
            break
        else:
            print(f"{Colors.RED}❌ Login failed. Please check your password.{Colors.RESET}")
            if attempt < max_attempts - 1:
                print(f"{Colors.YELLOW}🔄 Please try again...{Colors.RESET}")
            else:
                print(f"{Colors.RED}⚠️ Too many failed attempts. Continuing with test user.{Colors.RESET}")
    
    # Test results tracking
    results = {"passed": 0, "failed": 0, "total": 0}
    test_data = {
        "token": None,
        "user_id": None,
        "booking_id": None,
        "session_id": None,
        "payment_id": None,
        "reset_token": None,
        "cancelled_booking_id": None,
        "test_user_email": SABELO_EMAIL,
        "test_user_phone": "0712345678"
    }

    # ============ TEST 1: Health Check ============
    print_header("📊 HEALTH CHECKS")
    
    # 1.1 Root Health
    try:
        response = requests.get(f"{BASE_URL}/health")
        results["total"] += 1
        if response.status_code == 200:
            results["passed"] += 1
            print_test("Root Health Check", True, response.json())
        else:
            results["failed"] += 1
            print_test("Root Health Check", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Root Health Check", False, error=str(e))

    # 1.2 API Health
    try:
        response = requests.get(f"{API_URL}/test/health")
        results["total"] += 1
        if response.status_code == 200:
            results["passed"] += 1
            print_test("API Health Check", True, response.json())
        else:
            results["failed"] += 1
            print_test("API Health Check", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("API Health Check", False, error=str(e))

    # 1.3 Database Connection
    try:
        response = requests.get(f"{API_URL}/test/db")
        results["total"] += 1
        if response.status_code == 200:
            results["passed"] += 1
            print_test("Database Connection Check", True, response.json())
        else:
            results["failed"] += 1
            print_test("Database Connection Check", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Database Connection Check", False, error=str(e))

    # ============ TEST 2: Create Test User ============
    print_header("👤 TEST USER MANAGEMENT")
    try:
        response = requests.post(f"{API_URL}/test/create-test-user")
        results["total"] += 1
        if response.status_code == 200:
            data = response.json()
            # Only set token if we don't have Sabelo's token
            if not test_data["token"] and sabelo_token:
                test_data["token"] = sabelo_token
                test_data["user_id"] = data.get('user', {}).get('id')
                test_data["test_user_email"] = SABELO_EMAIL
            else:
                test_data["token"] = data.get('token')
                test_data["user_id"] = data.get('user', {}).get('id')
                test_data["test_user_email"] = data.get('user', {}).get('email')
            
            print_test("Create/Get Test User", True, {
                "user_id": test_data["user_id"],
                "email": test_data["test_user_email"]
            })
        else:
            results["failed"] += 1
            print_test("Create Test User", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Create Test User", False, error=str(e))

    # ============ TEST 3: User Registration ============
    print_header("📝 USER REGISTRATION FLOW")
    
    # 3.1 Signup New User
    test_data["test_user_email"] = f"test{uuid.uuid4().hex[:8]}@example.com"
    signup_data = {
        "email": test_data["test_user_email"],
        "password": "Test123!@#",
        "full_name": "Integration Test User",
        "grade": "11",
        "phone": test_data["test_user_phone"]
    }
    try:
        response = requests.post(f"{API_URL}/auth/signup", json=signup_data)
        results["total"] += 1
        if response.status_code == 201:
            data = response.json()
            print_test("Signup New User", True, {"email": signup_data["email"]})
        else:
            results["failed"] += 1
            print_test("Signup New User", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Signup New User", False, error=str(e))

    # 3.2 Duplicate Signup (Should Fail)
    try:
        response = requests.post(f"{API_URL}/auth/signup", json=signup_data)
        results["total"] += 1
        if response.status_code == 400:
            results["passed"] += 1
            print_test("Duplicate Signup (Expected Failure)", True, {"expected": "Email already registered"})
        else:
            results["failed"] += 1
            print_test("Duplicate Signup", False, error=f"Expected 400, got {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Duplicate Signup", False, error=str(e))

    # 3.3 Login with Test User (using the token we already have)
    print_subheader(f"Using token for testing")
    if test_data["token"]:
        print_test(f"Using existing token", True, {"token_prefix": test_data["token"][:20] + "..."})
    else:
        print_test(f"No token available", False)
        results["failed"] += 1

    # 3.4 Invalid Login (Should Fail)
    invalid_login = {"email": "wrong@example.com", "password": "wrongpass"}
    try:
        response = requests.post(f"{API_URL}/auth/login", json=invalid_login)
        results["total"] += 1
        if response.status_code == 401:
            results["passed"] += 1
            print_test("Invalid Login (Expected Failure)", True, {"expected": "Unauthorized"})
        else:
            results["failed"] += 1
            print_test("Invalid Login", False, error=f"Expected 401, got {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Invalid Login", False, error=str(e))

    if not test_data["token"]:
        print(f"{Colors.RED}❌ No token received - skipping authenticated tests{Colors.RESET}")
    else:
        auth_headers = {**HEADERS, "Authorization": f"Bearer {test_data['token']}"}

        # ============ TEST 4: User Authentication ============
        print_header("👤 USER AUTHENTICATION TESTS")
        
        # 4.1 Get Current User
        try:
            response = requests.get(f"{API_URL}/auth/me", headers=auth_headers)
            results["total"] += 1
            if response.status_code == 200:
                results["passed"] += 1
                user_data = response.json()
                print_test("Get Current User", True, {
                    "name": user_data.get('full_name'), 
                    "grade": user_data.get('grade'),
                    "email": user_data.get('email')
                })
            else:
                results["failed"] += 1
                print_test("Get Current User", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get Current User", False, error=str(e))

        # 4.2 Unauthorized Access (No Token)
        try:
            response = requests.get(f"{API_URL}/auth/me")
            results["total"] += 1
            if response.status_code == 403 or response.status_code == 401:
                results["passed"] += 1
                print_test("Unauthorized Access (Expected Failure)", True, {"expected": "Not authenticated"})
            else:
                results["failed"] += 1
                print_test("Unauthorized Access", False, error=f"Expected 401/403, got {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Unauthorized Access", False, error=str(e))

        # ============ TEST 5: Session Management ============
        print_header("📚 SESSION MANAGEMENT TESTS")
        
        # 5.1 Seed Sessions
        try:
            response = requests.post(f"{API_URL}/seed-sessions")
            results["total"] += 1
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                print_test("Seed Sessions", True, {
                    "total_sessions": stats.get('total_sessions'),
                    "group_sessions": stats.get('sunday_group_sessions'),
                    "one_on_one": stats.get('weekday_one_on_one_sessions')
                })
            else:
                results["failed"] += 1
                print_test("Seed Sessions", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Seed Sessions", False, error=str(e))

        # 5.2 Get All Sessions
        try:
            response = requests.get(f"{API_URL}/sessions")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                if sessions and len(sessions) > 0:
                    test_data["session_id"] = sessions[0]['id']
                print_test("Get All Sessions", True, {"count": len(sessions)})
            else:
                results["failed"] += 1
                print_test("Get All Sessions", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get All Sessions", False, error=str(e))

        # 5.3 Filter Sessions by Type
        try:
            response = requests.get(f"{API_URL}/sessions?session_type=group")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                print_test("Filter by Group Type", True, {"count": len(sessions)})
            else:
                results["failed"] += 1
                print_test("Filter by Group Type", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Filter by Group Type", False, error=str(e))

        # 5.4 Filter Sessions by Subject
        try:
            response = requests.get(f"{API_URL}/sessions?subject=Maths")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                print_test("Filter by Maths Subject", True, {"count": len(sessions)})
            else:
                results["failed"] += 1
                print_test("Filter by Maths Subject", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Filter by Maths Subject", False, error=str(e))

        # 5.5 Combined Filters
        try:
            response = requests.get(f"{API_URL}/sessions?session_type=group&subject=Maths")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                print_test("Combined Filters (Group + Maths)", True, {"count": len(sessions)})
            else:
                results["failed"] += 1
                print_test("Combined Filters", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Combined Filters", False, error=str(e))

        # 5.6 Get Single Session
        if test_data["session_id"]:
            try:
                response = requests.get(f"{API_URL}/sessions/{test_data['session_id']}")
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    session = response.json()
                    print_test("Get Single Session", True, {
                        "subject": session.get('subject'),
                        "date": session.get('date'),
                        "time": session.get('start_time')
                    })
                else:
                    results["failed"] += 1
                    print_test("Get Single Session", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get Single Session", False, error=str(e))

        # 5.7 Invalid Session ID
        try:
            response = requests.get(f"{API_URL}/sessions/invalid-id-12345")
            results["total"] += 1
            if response.status_code == 404:
                results["passed"] += 1
                print_test("Invalid Session ID (Expected Failure)", True, {"expected": "Not found"})
            else:
                results["failed"] += 1
                print_test("Invalid Session ID", False, error=f"Expected 404, got {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Invalid Session ID", False, error=str(e))

        # ============ TEST 6: Booking Operations ============
        if test_data["session_id"]:
            print_header("📅 BOOKING OPERATIONS TESTS")
            
            # 6.1 Create Booking
            booking_data = {
                "session_id": test_data["session_id"],
                "student_notes": "I need help with calculus and organic chemistry"
            }
            try:
                response = requests.post(f"{API_URL}/bookings", json=booking_data, headers=auth_headers)
                results["total"] += 1
                if response.status_code == 201:
                    data = response.json()
                    test_data["booking_id"] = data.get('booking_id')
                    print_test("Create Booking", True, {
                        "booking_id": test_data["booking_id"],
                        "amount": data.get('booking', {}).get('amount'),
                        "redirect": data.get('redirect_to_payment')
                    })
                else:
                    results["failed"] += 1
                    print_test("Create Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Create Booking", False, error=str(e))

            # 6.2 Duplicate Booking (Should Fail)
            if test_data["booking_id"]:
                try:
                    response = requests.post(f"{API_URL}/bookings", json=booking_data, headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 400:
                        results["passed"] += 1
                        print_test("Duplicate Booking (Expected Failure)", True, {"expected": "Already booked"})
                    else:
                        results["failed"] += 1
                        print_test("Duplicate Booking", False, error=f"Expected 400, got {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Duplicate Booking", False, error=str(e))

            # ============ TEST 7: Retrieve Bookings ============
            print_header("📋 RETRIEVE BOOKINGS TESTS")
            
            # 7.1 Get My Bookings
            try:
                response = requests.get(f"{API_URL}/bookings/my-bookings", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    bookings = response.json()
                    print_test("Get My Bookings", True, {"count": len(bookings)})
                else:
                    results["failed"] += 1
                    print_test("Get My Bookings", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get My Bookings", False, error=str(e))

            # 7.2 Get Single Booking
            if test_data["booking_id"]:
                try:
                    response = requests.get(f"{API_URL}/bookings/{test_data['booking_id']}", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 200:
                        data = response.json()
                        print_test("Get Single Booking", True, {
                            "status": data.get('status'),
                            "payment": data.get('payment_status'),
                            "amount": data.get('amount')
                        })
                    else:
                        results["failed"] += 1
                        print_test("Get Single Booking", False, error=f"Status {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Get Single Booking", False, error=str(e))

            # 7.3 Get Dashboard Stats
            try:
                response = requests.get(f"{API_URL}/dashboard/stats", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    stats = response.json()
                    print_test("Get Dashboard Stats", True, {
                        "total": stats.get('total_bookings'),
                        "confirmed": stats.get('confirmed_bookings'),
                        "pending": stats.get('pending_payments')
                    })
                else:
                    results["failed"] += 1
                    print_test("Get Dashboard Stats", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get Dashboard Stats", False, error=str(e))

            # ============ TEST 8: Payment Operations ============
            print_header("💰 PAYMENT OPERATIONS TESTS")
            
            # 8.1 Initiate Payment
            if test_data["booking_id"]:
                try:
                    response = requests.post(f"{API_URL}/payments/initiate/{test_data['booking_id']}", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 200:
                        data = response.json()
                        test_data["payment_id"] = data.get('payment_id')
                        print_test("Initiate Payment", True, {
                            "payment_id": test_data["payment_id"],
                            "url": data.get('payment_url')
                        })
                    else:
                        results["failed"] += 1
                        print_test("Initiate Payment", False, error=f"Status {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Initiate Payment", False, error=str(e))

            # 8.2 Get Payment for Booking
            if test_data["booking_id"]:
                try:
                    response = requests.get(f"{API_URL}/payments/booking/{test_data['booking_id']}", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 200:
                        data = response.json()
                        print_test("Get Payment for Booking", True, {
                            "payment_status": data.get('payment', {}).get('status')
                        })
                    else:
                        results["failed"] += 1
                        print_test("Get Payment for Booking", False, error=f"Status {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Get Payment for Booking", False, error=str(e))

            # 8.3 Verify Payment
            if test_data["payment_id"]:
                try:
                    response = requests.get(f"{API_URL}/payments/verify/{test_data['payment_id']}", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 200:
                        results["passed"] += 1
                        print_test("Verify Payment", True, response.json())
                    else:
                        results["failed"] += 1
                        print_test("Verify Payment", False, error=f"Status {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Verify Payment", False, error=str(e))

            # 8.4 Invalid Payment Verification
            try:
                response = requests.get(f"{API_URL}/payments/verify/invalid-payment-id", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 404:
                    results["passed"] += 1
                    print_test("Invalid Payment Verification (Expected Failure)", True, {"expected": "Not found"})
                else:
                    results["failed"] += 1
                    print_test("Invalid Payment Verification", False, error=f"Expected 404, got {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Invalid Payment Verification", False, error=str(e))

        # ============ TEST 9: Notification Testing ============
        print_header("📱 NOTIFICATION TESTS")
        print_subheader(f"Note: These tests will send emails to {SABELO_EMAIL}")
        
        try:
            response = requests.post(f"{API_URL}/test/send-notification", headers=auth_headers)
            results["total"] += 1
            if response.status_code == 200:
                data = response.json()
                print_test("Test Notifications", True, {
                    "email_sent": data.get('results', {}).get('email'),
                    "whatsapp_sent": data.get('results', {}).get('whatsapp'),
                    "recipient": SABELO_EMAIL
                })
            elif response.status_code == 404:
                print_test("Test Notifications", False, error="No bookings found for notification test")
                results["failed"] += 1
            else:
                results["failed"] += 1
                print_test("Test Notifications", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Test Notifications", False, error=str(e))

        # ============ TEST 10: Password Reset Flow ============
        print_header("🔑 PASSWORD RESET FLOW TESTS")
        
        # 10.1 Request Password Reset for Sabelo
        print_subheader(f"Requesting password reset for {SABELO_EMAIL}")
        forgot_data = {"email": SABELO_EMAIL}
        try:
            response = requests.post(f"{API_URL}/auth/forgot-password", json=forgot_data)
            results["total"] += 1
            if response.status_code == 200:
                results["passed"] += 1
                print_test(f"Forgot Password Request for {SABELO_EMAIL}", True, response.json())
            else:
                results["failed"] += 1
                print_test(f"Forgot Password Request for {SABELO_EMAIL}", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test(f"Forgot Password Request for {SABELO_EMAIL}", False, error=str(e))

        # 10.2 Request for Non-existent Email
        forgot_data_invalid = {"email": "nonexistent@example.com"}
        try:
            response = requests.post(f"{API_URL}/auth/forgot-password", json=forgot_data_invalid)
            results["total"] += 1
            if response.status_code == 200:
                # Should still return 200 for security
                results["passed"] += 1
                print_test("Forgot Password (Non-existent Email)", True, {"expected": "Security - same response"})
            else:
                results["failed"] += 1
                print_test("Forgot Password (Non-existent Email)", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Forgot Password (Non-existent Email)", False, error=str(e))

        # ============ TEST 11: Cancel and Delete Operations ============
        if test_data["booking_id"]:
            print_header("❌ CANCEL & DELETE OPERATIONS TESTS")
            
            # 11.1 Cancel Booking
            try:
                response = requests.put(f"{API_URL}/bookings/{test_data['booking_id']}/cancel", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    test_data["cancelled_booking_id"] = test_data["booking_id"]
                    print_test("Cancel Booking", True, response.json())
                else:
                    results["failed"] += 1
                    print_test("Cancel Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Cancel Booking", False, error=str(e))

            # 11.2 Cancel Already Cancelled Booking (Should Fail)
            if test_data["cancelled_booking_id"]:
                try:
                    response = requests.put(f"{API_URL}/bookings/{test_data['cancelled_booking_id']}/cancel", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 400:
                        results["passed"] += 1
                        print_test("Cancel Already Cancelled (Expected Failure)", True, {"expected": "Already cancelled"})
                    else:
                        results["failed"] += 1
                        print_test("Cancel Already Cancelled", False, error=f"Expected 400, got {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Cancel Already Cancelled", False, error=str(e))

            # 11.3 Delete Cancelled Booking
            if test_data["cancelled_booking_id"]:
                try:
                    response = requests.delete(f"{API_URL}/bookings/{test_data['cancelled_booking_id']}", headers=auth_headers)
                    results["total"] += 1
                    if response.status_code == 200:
                        results["passed"] += 1
                        print_test("Delete Cancelled Booking", True, response.json())
                    else:
                        results["failed"] += 1
                        print_test("Delete Cancelled Booking", False, error=f"Status {response.status_code}")
                except Exception as e:
                    results["failed"] += 1
                    print_test("Delete Cancelled Booking", False, error=str(e))

        # ============ TEST 12: CORS Testing ============
        print_header("🌐 CORS TESTS")
        
        # 12.1 CORS Headers
        try:
            response = requests.options(f"{API_URL}/auth/login", headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            })
            results["total"] += 1
            if response.status_code == 200:
                cors_headers = {
                    "allow-origin": response.headers.get('access-control-allow-origin'),
                    "allow-methods": response.headers.get('access-control-allow-methods')
                }
                print_test("CORS Preflight Request", True, cors_headers)
            else:
                results["failed"] += 1
                print_test("CORS Preflight Request", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("CORS Preflight Request", False, error=str(e))

        # 12.2 CORS with Different Origin
        try:
            response = requests.options(f"{API_URL}/auth/login", headers={
                "Origin": "http://malicious-site.com",
                "Access-Control-Request-Method": "POST"
            })
            results["total"] += 1
            allow_origin = response.headers.get('access-control-allow-origin')
            if allow_origin != "http://localhost:5173" and allow_origin != "*":
                results["passed"] += 1
                print_test("CORS Unauthorized Origin (Expected Restriction)", True, {"allowed": allow_origin})
            else:
                results["failed"] += 1
                print_test("CORS Unauthorized Origin", False, error=f"Unexpectedly allowed: {allow_origin}")
        except Exception as e:
            results["failed"] += 1
            print_test("CORS Unauthorized Origin", False, error=str(e))

    # ============ TEST SUMMARY ============
    print_header("📊 FINAL TEST SUMMARY")
    print(f"{Colors.BOLD}Duration: {Colors.RESET}Completed")
    print(f"{Colors.BOLD}Total Tests: {Colors.RESET}{results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.RESET}")
    
    if results['total'] > 0:
        success_rate = (results['passed'] / results['total']) * 100
        if success_rate >= 90:
            color = Colors.GREEN
        elif success_rate >= 70:
            color = Colors.YELLOW
        else:
            color = Colors.RED
        print(f"{color}Success Rate: {success_rate:.1f}%{Colors.RESET}")

    print(f"\n{Colors.BOLD}Test Categories:{Colors.RESET}")
    categories = {
        "Health Checks": 3,
        "User Management": 5,
        "Authentication": 3,
        "Sessions": 7,
        "Bookings": 4,
        "Payments": 5,
        "Notifications": 1,
        "Password Reset": 2,
        "Cancel/Delete": 3,
        "CORS": 2
    }
    for category, count in categories.items():
        print(f"  • {category}: {count} tests")

    if results['failed'] > 0:
        print(f"\n{Colors.RED}❌ {results['failed']} test(s) failed. Review the errors above.{Colors.RESET}")
        print(f"{Colors.YELLOW}💡 Tip: Check server logs for detailed error information{Colors.RESET}")
    else:
        print(f"\n{Colors.GREEN}✅ ALL {results['total']} TESTS PASSED! Your API is working perfectly!{Colors.RESET}")
        print(f"{Colors.GREEN}🎉 The new notification features are ready to use!{Colors.RESET}")
        print(f"{Colors.CYAN}📧 All test emails will be sent to: {SABELO_EMAIL}{Colors.RESET}")

    print(f"\n{Colors.BOLD}{Colors.PURPLE}{'='*60}{Colors.RESET}")

if __name__ == "__main__":
    try:
        run_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️ Tests interrupted by user{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}❌ Unexpected error: {e}{Colors.RESET}")