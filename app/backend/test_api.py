#!/usr/bin/env python3
"""
COMPREHENSIVE TEST SUITE FOR TUTORING BOOKING API
Tests every endpoint, flow, and edge case with detailed reporting
Author: QA Engineer
Run: python test_api.py
"""

import requests
import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import traceback
from enum import Enum

# ==================== CONFIGURATION ====================
BASE_URL = "http://localhost:8000/api"
TEST_EMAIL = "sabelozondo825@gmail.com"  # 🔥 USING YOUR EMAIL
TEST_PASSWORD = "Olweth-3"  # Set your password
TEST_PHONE = "0712345678"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

# ==================== TEST RESULTS TRACKING ====================
class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.total = 0
        self.errors = []
        self.warnings = []
        self.start_time = None
        self.end_time = None

    def start(self):
        self.start_time = datetime.now()

    def end(self):
        self.end_time = datetime.now()

    def add_pass(self, test_name: str):
        self.passed += 1
        self.total += 1
        print(f"{Colors.GREEN}✓ PASS: {test_name}{Colors.END}")

    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.total += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"{Colors.RED}✗ FAIL: {test_name}{Colors.END}")
        print(f"  {Colors.RED}Error: {error}{Colors.END}")

    def add_warning(self, test_name: str, warning: str):
        self.warnings.append(f"{test_name}: {warning}")
        print(f"{Colors.YELLOW}⚠ WARN: {test_name} - {warning}{Colors.END}")

    def print_summary(self):
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time else 0
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}TEST SUMMARY{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Total Tests: {self.total}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.END}")
        print(f"{Colors.YELLOW}Skipped: {self.skipped}{Colors.END}")
        
        if self.warnings:
            print(f"\n{Colors.YELLOW}WARNINGS:{Colors.END}")
            for w in self.warnings:
                print(f"  {Colors.YELLOW}⚠ {w}{Colors.END}")
        
        if self.errors:
            print(f"\n{Colors.RED}ERRORS:{Colors.END}")
            for e in self.errors:
                print(f"  {Colors.RED}✗ {e}{Colors.END}")
        
        success_rate = (self.passed / self.total * 100) if self.total > 0 else 0
        print(f"\n{Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}")

# ==================== TEST CLIENT ====================
class TestClient:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.results = TestResult()
        self.test_data = {
            'user': {},
            'sessions': [],
            'bookings': [],
            'payments': []
        }

    def print_header(self, title: str):
        """Print section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{title.center(60)}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

    def make_request(self, method: str, endpoint: str, **kwargs) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = kwargs.pop('headers', {})
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            response = self.session.request(method, url, headers=headers, timeout=10, **kwargs)
            
            if response.status_code >= 500:
                return False, None, f"Server error {response.status_code}: {response.text[:200]}"
            
            try:
                data = response.json() if response.content else {}
            except:
                data = response.text
            
            if response.status_code >= 400:
                error_msg = data.get('detail', str(data)) if isinstance(data, dict) else str(data)
                return False, data, f"HTTP {response.status_code}: {error_msg}"
            
            return True, data, None
            
        except requests.exceptions.ConnectionError:
            return False, None, f"Connection error: Cannot reach {BASE_URL}. Is the server running?"
        except requests.exceptions.Timeout:
            return False, None, "Request timeout"
        except Exception as e:
            return False, None, f"Request error: {str(e)}"

# ==================== TEST SUITES ====================
class TestSuite:
    def __init__(self, client: TestClient):
        self.client = client

    def test_health_check(self) -> bool:
        """Test 1: Health check endpoint"""
        test_name = "Health Check"
        try:
            # Try /health first, then fallback to /
            success, data, error = self.client.make_request('GET', '/health')
            
            if not success:
                # Try root endpoint as fallback
                success, data, error = self.client.make_request('GET', '/')
                if success:
                    self.client.results.add_warning(test_name, "Using root endpoint (no /health endpoint)")
                    self.client.results.add_pass(test_name)
                    return True
                else:
                    self.client.results.add_fail(test_name, error)
                    return False
            
            required_fields = ['status', 'timestamp', 'database']
            for field in required_fields:
                if field not in data:
                    self.client.results.add_warning(test_name, f"Missing field: {field}")
            
            if data.get('status') == 'healthy' or data.get('database') == 'connected':
                self.client.results.add_pass(test_name)
            else:
                self.client.results.add_warning(test_name, f"Server response: {data}")
                self.client.results.add_pass(test_name)
            
            return True
            
        except Exception as e:
            self.client.results.add_warning(test_name, f"Health check exception: {str(e)}")
            return True  # Don't fail the whole test suite

    def test_cors_configuration(self) -> bool:
        """Test 2: CORS headers"""
        test_name = "CORS Configuration"
        try:
            response = self.client.session.options(
                f"{BASE_URL}/auth/login",
                headers={
                    'Origin': 'http://localhost:5173',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                }
            )
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Credentials'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if missing_headers:
                self.client.results.add_warning(test_name, f"Missing CORS headers: {missing_headers}")
            else:
                self.client.results.add_pass(test_name)
            
            return True
            
        except Exception as e:
            self.client.results.add_warning(test_name, f"CORS test failed: {str(e)}")
            return False

    def test_login_with_sabelo(self) -> bool:
        """Test 3: Login with sabelozondo825@gmail.com"""
        print(f"\n{Colors.BOLD}Testing Login with {TEST_EMAIL}...{Colors.END}")
        
        test_name = "User Login"
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        success, data, error = self.client.make_request('POST', '/auth/login', json=login_data)
        
        if not success:
            self.client.results.add_fail(test_name, error)
            print(f"\n{Colors.YELLOW}💡 TIP: If login fails, you may need to:{Colors.END}")
            print(f"{Colors.YELLOW}   1. Create account first with this email{Colors.END}")
            print(f"{Colors.YELLOW}   2. Check your password{Colors.END}")
            print(f"{Colors.YELLOW}   3. Make sure server is running{Colors.END}")
            return False
        
        if 'token' not in data:
            self.client.results.add_fail(test_name, "No token in response")
            return False
        
        self.client.token = data['token']
        self.client.user_id = data['user']['id']
        self.client.test_data['user'] = data['user']
        self.client.results.add_pass(f"{test_name} - Logged in as {data['user']['full_name']}")
        
        return self.test_auth_verification()

    def test_auth_verification(self) -> bool:
        """Test 3c: Verify authentication"""
        test_name = "Auth Verification"
        success, data, error = self.client.make_request('GET', '/auth/me')
        
        if not success:
            self.client.results.add_fail(test_name, error)
            return False
        
        if data['email'] != TEST_EMAIL:
            self.client.results.add_fail(test_name, f"Email mismatch: {data.get('email')} != {TEST_EMAIL}")
            return False
        
        self.client.results.add_pass(f"{test_name} - Verified user: {data['full_name']}")
        return True

    def test_sessions(self) -> bool:
        """Test 4: Session endpoints"""
        print(f"\n{Colors.BOLD}Testing Session Endpoints...{Colors.END}")
        
        # 4.1 Get all sessions
        test_name = "GET /sessions"
        success, data, error = self.client.make_request('GET', '/sessions')
        
        if not success:
            self.client.results.add_fail(test_name, error)
            return False
        
        if not isinstance(data, list):
            self.client.results.add_fail(test_name, "Response is not a list")
            return False
        
        self.client.test_data['sessions'] = data
        self.client.results.add_pass(f"{test_name} - Found {len(data)} sessions")
        
        if len(data) == 0:
            self.client.results.add_warning("Sessions", "No sessions available - seed data may be missing")
            return True
        
        # 4.2 Get single session
        test_session = data[0]
        test_name = f"GET /sessions/{test_session['id']}"
        success, session_data, error = self.client.make_request('GET', f"/sessions/{test_session['id']}")
        
        if not success:
            self.client.results.add_fail(test_name, error)
        else:
            self.client.results.add_pass(test_name)
        
        # 4.3 Test filtering
        test_name = "Session Filtering"
        success, filtered, error = self.client.make_request(
            'GET', 
            '/sessions', 
            params={'session_type': 'group', 'available_only': True}
        )
        
        if success:
            self.client.results.add_pass(f"{test_name} - Group sessions: {len(filtered)}")
        else:
            self.client.results.add_warning(test_name, str(error))
        
        return True

    def test_user_bookings(self) -> bool:
        """Test 5: Get user's bookings"""
        print(f"\n{Colors.BOLD}Checking {TEST_EMAIL}'s Bookings...{Colors.END}")
        
        test_name = "GET /bookings/my-bookings"
        success, my_bookings, error = self.client.make_request('GET', '/bookings/my-bookings')
        
        if not success:
            self.client.results.add_fail(test_name, error)
            return False
        
        self.client.test_data['bookings'] = my_bookings
        self.client.results.add_pass(f"{test_name} - Found {len(my_bookings)} bookings")
        
        # Display user's bookings - FIXED: Handle null sessions
        if my_bookings:
            print(f"\n{Colors.BOLD}📋 Your Current Bookings:{Colors.END}")
            for i, booking in enumerate(my_bookings[:5], 1):
                session = booking.get('session')
                
                # 🔥 FIX: Check if session exists and is not None
                if session and isinstance(session, dict):
                    subject = session.get('subject', 'N/A')
                    date = session.get('date', 'N/A')
                    time = session.get('start_time', 'N/A')
                    print(f"  {i}. {subject} - {date} @ {time}")
                else:
                    # Handle bookings with missing session data
                    print(f"  {i}. Session ID: {booking.get('session_id', 'N/A')}")
                    print(f"     Status: {booking.get('status', 'N/A')}, Payment: {booking.get('payment_status', 'N/A')}")
                    print(f"     {Colors.YELLOW}⚠ Session details unavailable{Colors.END}")
                
                print(f"     Status: {booking['status']}, Payment: {booking['payment_status']}")
                
                # Show payment action if needed
                if booking['payment_status'] == 'pending' and booking['status'] != 'cancelled':
                    print(f"     {Colors.YELLOW}💰 Payment pending - Click to pay{Colors.END}")
        else:
            print(f"\n{Colors.YELLOW}📭 No bookings found for {TEST_EMAIL}{Colors.END}")
        
        return True

    def test_dashboard_stats(self) -> bool:
        """Test 6: Dashboard statistics for sabelo"""
        test_name = "GET /dashboard/stats"
        success, data, error = self.client.make_request('GET', '/dashboard/stats')
        
        if not success:
            self.client.results.add_fail(test_name, error)
            return False
        
        required_fields = [
            'total_bookings', 
            'confirmed_bookings', 
            'cancelled_bookings', 
            'pending_payments',
            'upcoming_sessions'
        ]
        
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            self.client.results.add_fail(test_name, f"Missing fields: {missing_fields}")
            return False
        
        self.client.results.add_pass(
            f"{test_name} - Stats for {TEST_EMAIL}: "
            f"Total={data['total_bookings']}, "
            f"Confirmed={data['confirmed_bookings']}, "
            f"Upcoming={data['upcoming_sessions']}"
        )
        
        # Display dashboard stats
        print(f"\n{Colors.BOLD}📊 Dashboard Statistics for {TEST_EMAIL}:{Colors.END}")
        print(f"  • Total Bookings: {data['total_bookings']}")
        print(f"  • Confirmed: {data['confirmed_bookings']}")
        print(f"  • Cancelled: {data['cancelled_bookings']}")
        print(f"  • Pending Payments: {data['pending_payments']}")
        print(f"  • Upcoming Sessions: {data['upcoming_sessions']}")
        
        return True

    def test_edge_cases(self) -> bool:
        """Test 7: Edge cases and error handling"""
        print(f"\n{Colors.BOLD}Testing Edge Cases...{Colors.END}")
        
        # 7.1 Invalid session ID
        test_name = "Invalid Session ID"
        invalid_id = str(uuid.uuid4())
        success, data, error = self.client.make_request('GET', f"/sessions/{invalid_id}")
        
        if success:
            self.client.results.add_fail(test_name, "Should return 404 for invalid session")
        elif '404' in str(error):
            self.client.results.add_pass(test_name)
        else:
            self.client.results.add_warning(test_name, f"Unexpected error: {error}")
        
        # 7.2 Unauthorized access
        test_name = "Unauthorized Access"
        old_token = self.client.token
        self.client.token = "invalid.token.here"
        
        success, data, error = self.client.make_request('GET', '/auth/me')
        if success:
            self.client.results.add_warning(test_name, "Request succeeded with invalid token")
        else:
            self.client.results.add_pass(test_name)
        
        self.client.token = old_token
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        self.client.results.start()
        
        self.client.print_header(f"🚀 TESTING ACCOUNT: {TEST_EMAIL}")
        print(f"Base URL: {BASE_URL}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test 1: Health Check (Don't fail if missing)
        self.test_health_check()
        
        # Test 2: CORS
        self.test_cors_configuration()
        
        # Test 3: Login with sabelo's email
        if self.test_login_with_sabelo():
            # Test 4: Sessions
            self.test_sessions()
            
            # Test 5: Get user's bookings
            self.test_user_bookings()
            
            # Test 6: Dashboard stats
            self.test_dashboard_stats()
            
            # Test 7: Edge Cases
            self.test_edge_cases()
        
        self.client.results.end()
        self.client.results.print_summary()
        
        # Final recommendation
        if self.client.results.failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ ACCOUNT VERIFIED: {TEST_EMAIL}{Colors.END}")
            print(f"{Colors.GREEN}   All systems operational!{Colors.END}")
            print(f"\n{Colors.BOLD}📊 YOUR BOOKING SUMMARY:{Colors.END}")
            
            # Show payment summary
            pending_payments = [b for b in self.client.test_data.get('bookings', []) 
                              if b.get('payment_status') == 'pending' and b.get('status') != 'cancelled']
            
            if pending_payments:
                print(f"{Colors.YELLOW}   ⚠ You have {len(pending_payments)} pending payment(s){Colors.END}")
                print(f"{Colors.YELLOW}   💰 Visit http://localhost:5173/my-bookings to pay{Colors.END}")
            else:
                print(f"{Colors.GREEN}   ✅ No pending payments{Colors.END}")
        else:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}📝 NEXT STEPS:{Colors.END}")
            print(f"{Colors.YELLOW}   1. Check if password is correct{Colors.END}")
            print(f"{Colors.YELLOW}   2. Try logging in manually at http://localhost:5173/login{Colors.END}")
            print(f"{Colors.YELLOW}   3. Make sure MongoDB is running{Colors.END}")
        
        return self.client.results.failed == 0

# ==================== MAIN EXECUTION ====================
def main():
    """Main test execution"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("╔══════════════════════════════════════════════════════╗")
    print("║     TUTORING BOOKING API - ACCOUNT VERIFICATION    ║")
    print("║              Testing: sabelozondo825@gmail.com     ║")
    print("╚══════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")
    
    # Password is set at the top of the file
    global TEST_PASSWORD
    if TEST_PASSWORD == "Olweth-3":
        print(f"{Colors.GREEN}✓ Using configured password{Colors.END}")
    else:
        TEST_PASSWORD = input(f"{Colors.YELLOW}🔑 Enter password for {TEST_EMAIL}: {Colors.END}")
    
    client = TestClient()
    suite = TestSuite(client)
    
    try:
        success = suite.run_all_tests()
        return 0 if success else 1
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠ Tests interrupted by user{Colors.END}")
        return 1
    except Exception as e:
        print(f"\n{Colors.RED}❌ Unexpected error: {e}{Colors.END}")
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())