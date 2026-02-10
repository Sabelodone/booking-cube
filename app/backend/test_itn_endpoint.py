# test_itn_endpoint.py
import requests
import json

print("🔧 Testing ITN Endpoint")
print("=" * 50)

itn_url = "https://tamisha-lukewarm-inarguably.ngrok-free.app/api/payments/itn"

print(f"Testing URL: {itn_url}")

# Test 1: GET request (should return 405 Method Not Allowed)
print("\n1. Testing GET request...")
try:
    response = requests.get(itn_url, timeout=10)
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text[:100]}")
    
    if response.status_code == 405:
        print("   ✅ GET returns 405 (Method Not Allowed) - CORRECT for POST endpoint")
    else:
        print(f"   ⚠️ Unexpected status: {response.status_code}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: POST request (simulate PayFast)
print("\n2. Testing POST request...")
try:
    test_data = {
        'm_payment_id': 'test_payment_123',
        'pf_payment_id': 'pf_test_456',
        'payment_status': 'COMPLETE',
        'amount_gross': '25.00',
        'item_name': 'Test Item',
        'custom_str1': 'test_booking',
        'custom_str2': 'test_user',
        'name_first': 'Test',
        'name_last': 'User',
        'email_address': 'test@example.com',
        'signature': 'test_signature_for_now'
    }
    
    print(f"   Sending test data to {itn_url}")
    response = requests.post(itn_url, data=test_data, timeout=30)
    
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")
    
    if response.status_code == 200:
        print("   ✅ POST request successful!")
    else:
        print(f"   ⚠️ POST returned: {response.status_code}")
        
except requests.exceptions.Timeout:
    print("   ❌ Timeout error - ngrok might be slow or blocking")
except requests.exceptions.SSLError as e:
    print(f"   ❌ SSL Error: {e}")
    print("   Try using http:// instead of https://")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check ngrok tunnels
print("\n3. Checking ngrok tunnels...")
try:
    tunnels_response = requests.get('http://127.0.0.1:4040/api/tunnels', timeout=5)
    if tunnels_response.status_code == 200:
        tunnels = tunnels_response.json().get('tunnels', [])
        print(f"   Found {len(tunnels)} tunnel(s):")
        for tunnel in tunnels:
            print(f"   - {tunnel.get('public_url')} -> {tunnel.get('config', {}).get('addr')}")
            print(f"     Protocol: {tunnel.get('proto')}")
    else:
        print(f"   ❌ Could not get tunnels: {tunnels_response.status_code}")
except:
    print("   ⚠️ Could not connect to ngrok API")

print("\n" + "=" * 50)
print("🎯 NEXT STEPS:")
print("1. Check Flask server is running")
print("2. Try HTTP instead of HTTPS for ngrok")
print("3. Check firewall/antivirus blocking")
print("=" * 50)