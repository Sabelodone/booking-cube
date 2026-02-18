import requests
import json
import uuid
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_test(name, status, data=None, error=None):
    status_symbol = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if status else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status_symbol} {name}")
    if data:
        print(f"   {Colors.YELLOW}Response:{Colors.RESET} {json.dumps(data, indent=2)[:200]}...")
    if error:
        print(f"   {Colors.RED}Error: {error}{Colors.RESET}")

def run_tests():
    print_header("🚀 TESTING ALL API ENDPOINTS")
    print(f"Base URL: {API_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test results tracking
    results = {"passed": 0, "failed": 0, "total": 0}
    token = None
    user_id = None
    booking_id = None
    session_id = None
    payment_id = None
    reset_token = None

    # ============ TEST 1: Health Check ============
    print_header("📊 HEALTH CHECKS")
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

    try:
        response = requests.get(f"{API_URL}/test/db")
        results["total"] += 1
        if response.status_code == 200:
            results["passed"] += 1
            print_test("Database Check", True, response.json())
        else:
            results["failed"] += 1
            print_test("Database Check", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Database Check", False, error=str(e))

    # ============ TEST 2: Create Test User ============
    print_header("👤 USER CREATION")
    try:
        response = requests.post(f"{API_URL}/test/create-test-user")
        results["total"] += 1
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user_id = data.get('user', {}).get('id')
            print_test("Create Test User", True, data)
        else:
            results["failed"] += 1
            print_test("Create Test User", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Create Test User", False, error=str(e))

    # ============ TEST 3: Signup ============
    print_header("📝 SIGNUP")
    unique_email = f"test{uuid.uuid4().hex[:8]}@example.com"
    signup_data = {
        "email": unique_email,
        "password": "Test123!",
        "full_name": "Test User",
        "grade": "10",
        "phone": "0712345678"
    }
    try:
        response = requests.post(f"{API_URL}/auth/signup", json=signup_data)
        results["total"] += 1
        if response.status_code == 201:
            data = response.json()
            print_test("Signup New User", True, data)
        else:
            results["failed"] += 1
            print_test("Signup New User", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Signup New User", False, error=str(e))

    # ============ TEST 4: Login ============
    print_header("🔐 LOGIN")
    login_data = {
        "email": "test@example.com",
        "password": "test123"
    }
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        results["total"] += 1
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print_test("Login", True, data)
        else:
            results["failed"] += 1
            print_test("Login", False, error=f"Status {response.status_code}")
    except Exception as e:
        results["failed"] += 1
        print_test("Login", False, error=str(e))

    if not token:
        print(f"{Colors.RED}❌ No token received - skipping authenticated tests{Colors.RESET}")
    else:
        auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}

        # ============ TEST 5: Get Current User ============
        print_header("👤 GET CURRENT USER")
        try:
            response = requests.get(f"{API_URL}/auth/me", headers=auth_headers)
            results["total"] += 1
            if response.status_code == 200:
                results["passed"] += 1
                print_test("Get Me", True, response.json())
            else:
                results["failed"] += 1
                print_test("Get Me", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get Me", False, error=str(e))

        # ============ TEST 6: Seed Sessions ============
        print_header("🌱 SEED SESSIONS")
        try:
            response = requests.post(f"{API_URL}/seed-sessions")
            results["total"] += 1
            if response.status_code == 200:
                data = response.json()
                print_test("Seed Sessions", True, data)
                if data.get('stats', {}).get('total_sessions', 0) > 0:
                    session_id = data.get('stats', {}).get('session_id')
            else:
                results["failed"] += 1
                print_test("Seed Sessions", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Seed Sessions", False, error=str(e))

        # ============ TEST 7: Get Sessions ============
        print_header("📚 GET SESSIONS")
        try:
            response = requests.get(f"{API_URL}/sessions")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                print_test("Get All Sessions", True, {"count": len(sessions)})
                if sessions and len(sessions) > 0:
                    session_id = sessions[0]['id']
            else:
                results["failed"] += 1
                print_test("Get All Sessions", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get All Sessions", False, error=str(e))

        # ============ TEST 8: Get Sessions with Filters ============
        try:
            response = requests.get(f"{API_URL}/sessions?session_type=group&subject=Maths")
            results["total"] += 1
            if response.status_code == 200:
                sessions = response.json()
                print_test("Get Filtered Sessions", True, {"count": len(sessions)})
            else:
                results["failed"] += 1
                print_test("Get Filtered Sessions", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get Filtered Sessions", False, error=str(e))

        # ============ TEST 9: Get Single Session ============
        if session_id:
            try:
                response = requests.get(f"{API_URL}/sessions/{session_id}")
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    print_test("Get Single Session", True, response.json())
                else:
                    results["failed"] += 1
                    print_test("Get Single Session", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get Single Session", False, error=str(e))

        # ============ TEST 10: Create Booking ============
        if session_id:
            print_header("📅 CREATE BOOKING")
            booking_data = {
                "session_id": session_id,
                "student_notes": "Test booking notes"
            }
            try:
                response = requests.post(f"{API_URL}/bookings", json=booking_data, headers=auth_headers)
                results["total"] += 1
                if response.status_code == 201:
                    data = response.json()
                    booking_id = data.get('booking_id')
                    print_test("Create Booking", True, data)
                else:
                    results["failed"] += 1
                    print_test("Create Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Create Booking", False, error=str(e))

        # ============ TEST 11: Get My Bookings ============
        print_header("📋 GET MY BOOKINGS")
        try:
            response = requests.get(f"{API_URL}/bookings/my-bookings", headers=auth_headers)
            results["total"] += 1
            if response.status_code == 200:
                bookings = response.json()
                print_test("Get My Bookings", True, {"count": len(bookings)})
                if bookings and len(bookings) > 0 and not booking_id:
                    booking_id = bookings[0]['id']
            else:
                results["failed"] += 1
                print_test("Get My Bookings", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get My Bookings", False, error=str(e))

        # ============ TEST 12: Get Single Booking ============
        if booking_id:
            try:
                response = requests.get(f"{API_URL}/bookings/{booking_id}", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    data = response.json()
                    print_test("Get Single Booking", True, data)
                else:
                    results["failed"] += 1
                    print_test("Get Single Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get Single Booking", False, error=str(e))

        # ============ TEST 13: Get Dashboard Stats ============
        print_header("📊 DASHBOARD STATS")
        try:
            response = requests.get(f"{API_URL}/dashboard/stats", headers=auth_headers)
            results["total"] += 1
            if response.status_code == 200:
                results["passed"] += 1
                print_test("Get Dashboard Stats", True, response.json())
            else:
                results["failed"] += 1
                print_test("Get Dashboard Stats", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Get Dashboard Stats", False, error=str(e))

        # ============ TEST 14: Initiate Payment ============
        if booking_id:
            print_header("💰 INITIATE PAYMENT")
            try:
                response = requests.post(f"{API_URL}/payments/initiate/{booking_id}", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    data = response.json()
                    payment_id = data.get('payment_id')
                    print_test("Initiate Payment", True, data)
                else:
                    results["failed"] += 1
                    print_test("Initiate Payment", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Initiate Payment", False, error=str(e))

        # ============ TEST 15: Get Payment for Booking ============
        if booking_id:
            try:
                response = requests.get(f"{API_URL}/payments/booking/{booking_id}", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    print_test("Get Payment for Booking", True, response.json())
                else:
                    results["failed"] += 1
                    print_test("Get Payment for Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Get Payment for Booking", False, error=str(e))

        # ============ TEST 16: Verify Payment ============
        if payment_id:
            try:
                response = requests.get(f"{API_URL}/payments/verify/{payment_id}", headers=auth_headers)
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

        # ============ TEST 17: Forgot Password ============
        print_header("🔑 PASSWORD RESET FLOW")
        forgot_data = {"email": "test@example.com"}
        try:
            response = requests.post(f"{API_URL}/auth/forgot-password", json=forgot_data)
            results["total"] += 1
            if response.status_code == 200:
                results["passed"] += 1
                print_test("Forgot Password", True, response.json())
            else:
                results["failed"] += 1
                print_test("Forgot Password", False, error=f"Status {response.status_code}")
        except Exception as e:
            results["failed"] += 1
            print_test("Forgot Password", False, error=str(e))

        # ============ TEST 18: Cancel Booking ============
        if booking_id:
            print_header("❌ CANCEL BOOKING")
            try:
                response = requests.put(f"{API_URL}/bookings/{booking_id}/cancel", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    print_test("Cancel Booking", True, response.json())
                else:
                    results["failed"] += 1
                    print_test("Cancel Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Cancel Booking", False, error=str(e))

        # ============ TEST 19: Delete Booking ============
        if booking_id:
            print_header("🗑️ DELETE BOOKING")
            try:
                response = requests.delete(f"{API_URL}/bookings/{booking_id}", headers=auth_headers)
                results["total"] += 1
                if response.status_code == 200:
                    results["passed"] += 1
                    print_test("Delete Booking", True, response.json())
                else:
                    results["failed"] += 1
                    print_test("Delete Booking", False, error=f"Status {response.status_code}")
            except Exception as e:
                results["failed"] += 1
                print_test("Delete Booking", False, error=str(e))

    # ============ TEST SUMMARY ============
    print_header("📊 TEST SUMMARY")
    print(f"{Colors.BOLD}Duration: {Colors.RESET}Completed")
    print(f"{Colors.BOLD}Total Tests: {Colors.RESET}{results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.RESET}")
    print(f"{Colors.YELLOW}Success Rate: {results['passed']/results['total']*100:.1f}%{Colors.RESET}")

    if results['failed'] > 0:
        print(f"\n{Colors.RED}❌ Some tests failed. Check the errors above.{Colors.RESET}")
    else:
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED! Your API is working perfectly!{Colors.RESET}")

    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

if __name__ == "__main__":
    run_tests()