import hashlib
import urllib.parse

# Your EXACT values from .env
MERCHANT_ID = '10045678'
MERCHANT_KEY = 'hu0gmig9tq9jj'
PASSPHRASE = 'tutorhub2026'  # Copy exactly from PayFast

# Simple test payload
data = {
    'merchant_id': MERCHANT_ID,
    'merchant_key': MERCHANT_KEY,
    'amount': '100.00'
}

# Generate signature
sorted_keys = sorted(data.keys())
param_string = '&'.join([f"{k}={urllib.parse.quote_plus(str(data[k]))}" for k in sorted_keys])
param_string_with_pass = param_string + f"&passphrase={urllib.parse.quote_plus(PASSPHRASE)}"
signature = hashlib.md5(param_string_with_pass.encode('utf-8')).hexdigest()

print(f"PASSPHRASE: '{PASSPHRASE}'")
print(f"Signature: {signature}")