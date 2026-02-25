import requests
import json

base_url = "http://localhost:8000"

print("="*50)
print("📧 TESTING EMAIL FOR sabelozondo825@gmail.com")
print("="*50)

# Test 1: Email debug
print("\n1️⃣ Testing email debug endpoint...")
debug_response = requests.post(
    f"{base_url}/api/test/email-debug",
    json={"email": "sabelozondo825@gmail.com"}
)

print(f"Status: {debug_response.status_code}")
print(json.dumps(debug_response.json(), indent=2))

# Test 2: Forgot password
print("\n2️⃣ Testing forgot password endpoint...")
forgot_response = requests.post(
    f"{base_url}/api/auth/forgot-password",
    json={"email": "sabelozondo825@gmail.com"}
)

print(f"Status: {forgot_response.status_code}")
print(json.dumps(forgot_response.json(), indent=2))

# Test 3: Try to login to verify user exists
print("\n3️⃣ Verifying user exists...")
login_response = requests.post(
    f"{base_url}/api/auth/login",
    json={
        "email": "sabelozondo825@gmail.com",
        "password": "Olweth-3"  # You'll need to enter the actual password
    }
)

if login_response.status_code == 200:
    print("✅ User verified! Login successful")
    print(f"Token: {login_response.json().get('token', '')[:20]}...")
else:
    print(f"❌ Login failed: {login_response.text}")