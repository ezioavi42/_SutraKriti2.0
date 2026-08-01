#!/usr/bin/env python3
"""
SutraKriti Backend API Test Suite - Round 3
Tests admin authentication, admin endpoints, and retests public endpoints
"""
import requests
import json
import os
from io import BytesIO
from PIL import Image

# Load base URL from .env
BASE_URL = "https://stock-admin-panel-2.preview.emergentagent.com/api"
ADMIN_PASSWORD = "sutrakriti-admin-dev"
UPLOAD_TOKEN = "sutrakriti-dev-upload-token"

print("=" * 80)
print("SutraKriti Backend API Test Suite - Round 3")
print("=" * 80)
print(f"Base URL: {BASE_URL}\n")

# Track test results
tests_passed = 0
tests_failed = 0
admin_cookie = None

def test_result(name, passed, details=""):
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"  → {details}")
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1
    print()

# ============================================================================
# PART 1: RETEST PUBLIC ENDPOINTS
# ============================================================================
print("\n" + "=" * 80)
print("PART 1: RETESTING PUBLIC ENDPOINTS")
print("=" * 80 + "\n")

# Test 1: GET /api/health
try:
    r = requests.get(f"{BASE_URL}/health", timeout=10)
    if r.status_code == 200:
        data = r.json()
        if data.get('ok') and data.get('db') and data.get('mail') == False:
            test_result("GET /api/health", True, f"Returns {data}")
        else:
            test_result("GET /api/health", False, f"Unexpected response: {data}")
    else:
        test_result("GET /api/health", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("GET /api/health", False, f"Exception: {e}")

# Test 2: GET /api/products
try:
    r = requests.get(f"{BASE_URL}/products", timeout=10)
    if r.status_code == 200:
        data = r.json()
        products = data.get('products', [])
        if len(products) == 8:
            test_result("GET /api/products", True, f"Returns 8 products")
        else:
            test_result("GET /api/products", False, f"Expected 8 products, got {len(products)}")
    else:
        test_result("GET /api/products", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("GET /api/products", False, f"Exception: {e}")

# Test 3: POST /api/custom-order
try:
    payload = {
        "name": "Priya Sharma",
        "contact": "9876543210",
        "email": "priya.sharma@example.com",
        "productType": "Handbag",
        "colors": "Terracotta, Cream",
        "size": "Medium",
        "budget": "3000-5000",
        "occasion": "Wedding gift",
        "notes": "Need by next month"
    }
    r = requests.post(f"{BASE_URL}/custom-order", json=payload, timeout=10)
    if r.status_code == 200:
        data = r.json()
        if data.get('ok') and data.get('id') and data.get('emailStatus') == 'skipped':
            test_result("POST /api/custom-order", True, f"Created order {data['id']}, emailStatus: {data['emailStatus']}")
            # Save order ID for later admin tests
            global test_order_id
            test_order_id = data['id']
        else:
            test_result("POST /api/custom-order", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/custom-order", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/custom-order", False, f"Exception: {e}")

# Test 4: POST /api/newsletter
try:
    r = requests.post(f"{BASE_URL}/newsletter", json={"email": "test@example.com"}, timeout=10)
    if r.status_code == 200:
        data = r.json()
        if data.get('ok'):
            test_result("POST /api/newsletter", True, "Subscribed successfully")
        else:
            test_result("POST /api/newsletter", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/newsletter", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/newsletter", False, f"Exception: {e}")

# Test 5: POST /api/contact
try:
    r = requests.post(f"{BASE_URL}/contact", json={"name": "Test User", "message": "Test message"}, timeout=10)
    if r.status_code == 200:
        data = r.json()
        if data.get('ok'):
            test_result("POST /api/contact", True, "Contact submitted successfully")
        else:
            test_result("POST /api/contact", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/contact", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/contact", False, f"Exception: {e}")

# Test 6: POST /api/razorpay/order (should return 503)
try:
    r = requests.post(f"{BASE_URL}/razorpay/order", json={"productId": "p-tote-terracotta"}, timeout=10)
    if r.status_code == 503:
        data = r.json()
        if data.get('error') == 'payment_unconfigured' and data.get('whatsappNumber'):
            test_result("POST /api/razorpay/order", True, "Returns 503 payment_unconfigured (CORRECT)")
        else:
            test_result("POST /api/razorpay/order", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/razorpay/order", False, f"Expected 503, got {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/razorpay/order", False, f"Exception: {e}")

# Test 7: POST /api/upload (with token)
try:
    # Create a small test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    files = {'file': ('test-image.png', img_bytes, 'image/png')}
    headers = {'x-upload-token': UPLOAD_TOKEN}
    r = requests.post(f"{BASE_URL}/upload", files=files, headers=headers, timeout=10)
    
    if r.status_code == 200:
        data = r.json()
        if data.get('ok') and data.get('id') and data.get('url'):
            test_result("POST /api/upload (with token)", True, f"Uploaded {data['filename']}, id: {data['id']}")
            # Save upload ID for later deletion test
            global test_upload_id
            test_upload_id = data['id']
        else:
            test_result("POST /api/upload (with token)", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/upload (with token)", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/upload (with token)", False, f"Exception: {e}")

# Test 8: POST /api/upload (without token - should fail)
try:
    img = Image.new('RGB', (100, 100), color='blue')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    files = {'file': ('test-image2.png', img_bytes, 'image/png')}
    r = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
    
    if r.status_code == 401:
        data = r.json()
        if data.get('error') == 'unauthorised':
            test_result("POST /api/upload (without token)", True, "Returns 401 unauthorised (CORRECT)")
        else:
            test_result("POST /api/upload (without token)", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/upload (without token)", False, f"Expected 401, got {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/upload (without token)", False, f"Exception: {e}")

# ============================================================================
# PART 2: ADMIN AUTHENTICATION
# ============================================================================
print("\n" + "=" * 80)
print("PART 2: ADMIN AUTHENTICATION")
print("=" * 80 + "\n")

# Test 9: POST /api/admin/login (wrong password)
try:
    r = requests.post(f"{BASE_URL}/admin/login", json={"password": "wrong-password"}, timeout=10)
    if r.status_code == 401:
        data = r.json()
        if data.get('error') == 'invalid_credentials':
            test_result("POST /api/admin/login (wrong password)", True, "Returns 401 invalid_credentials")
        else:
            test_result("POST /api/admin/login (wrong password)", False, f"Unexpected response: {data}")
    else:
        test_result("POST /api/admin/login (wrong password)", False, f"Expected 401, got {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/admin/login (wrong password)", False, f"Exception: {e}")

# Test 10: POST /api/admin/login (correct password)
try:
    r = requests.post(f"{BASE_URL}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=10)
    if r.status_code == 200:
        data = r.json()
        cookies = r.cookies
        if data.get('ok') and 'sk_admin' in cookies:
            admin_cookie = cookies['sk_admin']
            test_result("POST /api/admin/login (correct password)", True, f"Returns 200, cookie set: sk_admin={admin_cookie[:20]}...")
        else:
            test_result("POST /api/admin/login (correct password)", False, f"Cookie not set or unexpected response: {data}")
    else:
        test_result("POST /api/admin/login (correct password)", False, f"Status {r.status_code}: {r.text}")
except Exception as e:
    test_result("POST /api/admin/login (correct password)", False, f"Exception: {e}")

# Test 11: GET /api/admin/me (without cookie)
try:
    r = requests.get(f"{BASE_URL}/admin/me", timeout=10)
    if r.status_code == 401:
        data = r.json()
        if data.get('error') == 'unauthorised':
            test_result("GET /api/admin/me (without cookie)", True, "Returns 401 unauthorised")
        else:
            test_result("GET /api/admin/me (without cookie)", False, f"Unexpected response: {data}")
    else:
        test_result("GET /api/admin/me (without cookie)", False, f"Expected 401, got {r.status_code}: {r.text}")
except Exception as e:
    test_result("GET /api/admin/me (without cookie)", False, f"Exception: {e}")

# Test 12: GET /api/admin/me (with cookie)
if admin_cookie:
    try:
        cookies = {'sk_admin': admin_cookie}
        r = requests.get(f"{BASE_URL}/admin/me", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('authenticated'):
                test_result("GET /api/admin/me (with cookie)", True, "Returns 200 authenticated:true")
            else:
                test_result("GET /api/admin/me (with cookie)", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/me (with cookie)", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/me (with cookie)", False, f"Exception: {e}")
else:
    test_result("GET /api/admin/me (with cookie)", False, "No admin cookie available")

# ============================================================================
# PART 3: ADMIN ENDPOINTS WITHOUT COOKIE (should all return 401)
# ============================================================================
print("\n" + "=" * 80)
print("PART 3: ADMIN ENDPOINTS WITHOUT COOKIE (should all return 401)")
print("=" * 80 + "\n")

admin_routes_to_test = [
    ("GET", "/admin/stats"),
    ("GET", "/admin/custom-orders"),
    ("GET", "/admin/uploads"),
    ("GET", "/admin/contacts"),
    ("GET", "/admin/newsletter"),
    ("GET", "/admin/payments"),
]

for method, route in admin_routes_to_test:
    try:
        if method == "GET":
            r = requests.get(f"{BASE_URL}{route}", timeout=10)
        elif method == "POST":
            r = requests.post(f"{BASE_URL}{route}", json={}, timeout=10)
        
        if r.status_code == 401:
            data = r.json()
            if data.get('error') == 'unauthorised':
                test_result(f"{method} {route} (without cookie)", True, "Returns 401 unauthorised")
            else:
                test_result(f"{method} {route} (without cookie)", False, f"Unexpected response: {data}")
        else:
            test_result(f"{method} {route} (without cookie)", False, f"Expected 401, got {r.status_code}: {r.text}")
    except Exception as e:
        test_result(f"{method} {route} (without cookie)", False, f"Exception: {e}")

# ============================================================================
# PART 4: ADMIN ENDPOINTS WITH COOKIE
# ============================================================================
print("\n" + "=" * 80)
print("PART 4: ADMIN ENDPOINTS WITH COOKIE")
print("=" * 80 + "\n")

if admin_cookie:
    cookies = {'sk_admin': admin_cookie}
    
    # Test 13: GET /api/admin/stats
    try:
        r = requests.get(f"{BASE_URL}/admin/stats", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            required_keys = ['orders', 'uploads', 'newsletter', 'contacts', 'payments', 'recent']
            if all(k in data for k in required_keys):
                test_result("GET /api/admin/stats", True, f"Returns stats: orders={data['orders']}, uploads={data['uploads']}, newsletter={data['newsletter']}")
            else:
                test_result("GET /api/admin/stats", False, f"Missing keys in response: {data}")
        else:
            test_result("GET /api/admin/stats", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/stats", False, f"Exception: {e}")
    
    # Test 14: GET /api/admin/custom-orders
    try:
        r = requests.get(f"{BASE_URL}/admin/custom-orders", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'orders' in data and isinstance(data['orders'], list):
                test_result("GET /api/admin/custom-orders", True, f"Returns {len(data['orders'])} orders")
            else:
                test_result("GET /api/admin/custom-orders", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/custom-orders", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/custom-orders", False, f"Exception: {e}")
    
    # Test 15: GET /api/admin/custom-orders?status=new
    try:
        r = requests.get(f"{BASE_URL}/admin/custom-orders?status=new", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'orders' in data and isinstance(data['orders'], list):
                test_result("GET /api/admin/custom-orders?status=new", True, f"Returns {len(data['orders'])} new orders")
            else:
                test_result("GET /api/admin/custom-orders?status=new", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/custom-orders?status=new", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/custom-orders?status=new", False, f"Exception: {e}")
    
    # Test 16: GET /api/admin/uploads
    try:
        r = requests.get(f"{BASE_URL}/admin/uploads", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'uploads' in data and isinstance(data['uploads'], list):
                test_result("GET /api/admin/uploads", True, f"Returns {len(data['uploads'])} uploads")
            else:
                test_result("GET /api/admin/uploads", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/uploads", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/uploads", False, f"Exception: {e}")
    
    # Test 17: GET /api/admin/contacts
    try:
        r = requests.get(f"{BASE_URL}/admin/contacts", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'contacts' in data and isinstance(data['contacts'], list):
                test_result("GET /api/admin/contacts", True, f"Returns {len(data['contacts'])} contacts")
            else:
                test_result("GET /api/admin/contacts", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/contacts", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/contacts", False, f"Exception: {e}")
    
    # Test 18: GET /api/admin/newsletter
    try:
        r = requests.get(f"{BASE_URL}/admin/newsletter", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'subscribers' in data and isinstance(data['subscribers'], list):
                test_result("GET /api/admin/newsletter", True, f"Returns {len(data['subscribers'])} subscribers")
            else:
                test_result("GET /api/admin/newsletter", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/newsletter", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/newsletter", False, f"Exception: {e}")
    
    # Test 19: GET /api/admin/payments
    try:
        r = requests.get(f"{BASE_URL}/admin/payments", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if 'payments' in data and isinstance(data['payments'], list):
                test_result("GET /api/admin/payments", True, f"Returns {len(data['payments'])} payments")
            else:
                test_result("GET /api/admin/payments", False, f"Unexpected response: {data}")
        else:
            test_result("GET /api/admin/payments", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("GET /api/admin/payments", False, f"Exception: {e}")

else:
    print("⚠️  Skipping authenticated admin endpoint tests - no admin cookie available\n")

# ============================================================================
# PART 5: ORDER ACTIONS
# ============================================================================
print("\n" + "=" * 80)
print("PART 5: ORDER ACTIONS")
print("=" * 80 + "\n")

if admin_cookie and 'test_order_id' in globals():
    cookies = {'sk_admin': admin_cookie}
    order_id = test_order_id
    
    # Test 20: POST /api/admin/custom-orders/:id/action (action=accept)
    try:
        payload = {
            "action": "accept",
            "note": "Order accepted, will start work soon",
            "timeline": "2-3 weeks",
            "sendEmail": True
        }
        r = requests.post(f"{BASE_URL}/admin/custom-orders/{order_id}/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('ok') and data.get('status') == 'accepted' and data.get('emailStatus') == 'smtp_not_configured':
                test_result("POST /admin/custom-orders/:id/action (accept)", True, f"Status: {data['status']}, emailStatus: {data['emailStatus']} (CORRECT)")
            else:
                test_result("POST /admin/custom-orders/:id/action (accept)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (accept)", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (accept)", False, f"Exception: {e}")
    
    # Test 21: POST /api/admin/custom-orders/:id/action (action=complete)
    try:
        payload = {"action": "complete", "note": "Order completed and shipped"}
        r = requests.post(f"{BASE_URL}/admin/custom-orders/{order_id}/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('ok') and data.get('status') == 'completed' and data.get('order', {}).get('completed_at'):
                test_result("POST /admin/custom-orders/:id/action (complete)", True, f"Status: {data['status']}, completed_at: {data['order']['completed_at']}")
            else:
                test_result("POST /admin/custom-orders/:id/action (complete)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (complete)", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (complete)", False, f"Exception: {e}")
    
    # Test 22: POST /api/admin/custom-orders/:id/action (action=reopen)
    try:
        payload = {"action": "reopen"}
        r = requests.post(f"{BASE_URL}/admin/custom-orders/{order_id}/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            order = data.get('order', {})
            if data.get('ok') and data.get('status') == 'new' and not order.get('accepted_at') and not order.get('completed_at'):
                test_result("POST /admin/custom-orders/:id/action (reopen)", True, f"Status: {data['status']}, accepted_at: {order.get('accepted_at')}, completed_at: {order.get('completed_at')}")
            else:
                test_result("POST /admin/custom-orders/:id/action (reopen)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (reopen)", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (reopen)", False, f"Exception: {e}")
    
    # Test 23: POST /api/admin/custom-orders/:id/action (action=note)
    try:
        payload = {"action": "note", "note": "Customer called to confirm details"}
        r = requests.post(f"{BASE_URL}/admin/custom-orders/{order_id}/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            order = data.get('order', {})
            if data.get('ok') and order.get('admin_note') == "Customer called to confirm details":
                test_result("POST /admin/custom-orders/:id/action (note)", True, f"admin_note updated: {order.get('admin_note')}")
            else:
                test_result("POST /admin/custom-orders/:id/action (note)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (note)", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (note)", False, f"Exception: {e}")
    
    # Test 24: POST /api/admin/custom-orders/:id/action (invalid action)
    try:
        payload = {"action": "invalid_action"}
        r = requests.post(f"{BASE_URL}/admin/custom-orders/{order_id}/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get('error') == 'invalid action':
                test_result("POST /admin/custom-orders/:id/action (invalid action)", True, "Returns 400 invalid action")
            else:
                test_result("POST /admin/custom-orders/:id/action (invalid action)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (invalid action)", False, f"Expected 400, got {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (invalid action)", False, f"Exception: {e}")
    
    # Test 25: POST /api/admin/custom-orders/:id/action (unknown order id)
    try:
        payload = {"action": "accept"}
        r = requests.post(f"{BASE_URL}/admin/custom-orders/unknown-order-id/action", json=payload, cookies=cookies, timeout=10)
        if r.status_code == 404:
            data = r.json()
            if data.get('error') == 'order not found':
                test_result("POST /admin/custom-orders/:id/action (unknown id)", True, "Returns 404 order not found")
            else:
                test_result("POST /admin/custom-orders/:id/action (unknown id)", False, f"Unexpected response: {data}")
        else:
            test_result("POST /admin/custom-orders/:id/action (unknown id)", False, f"Expected 404, got {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /admin/custom-orders/:id/action (unknown id)", False, f"Exception: {e}")

else:
    print("⚠️  Skipping order action tests - no admin cookie or test order available\n")

# ============================================================================
# PART 6: DELETE UPLOAD
# ============================================================================
print("\n" + "=" * 80)
print("PART 6: DELETE UPLOAD")
print("=" * 80 + "\n")

if admin_cookie and 'test_upload_id' in globals():
    cookies = {'sk_admin': admin_cookie}
    upload_id = test_upload_id
    
    # Test 26: DELETE /api/admin/uploads/:id
    try:
        r = requests.delete(f"{BASE_URL}/admin/uploads/{upload_id}", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('ok'):
                test_result("DELETE /api/admin/uploads/:id", True, f"Deleted upload {upload_id}")
            else:
                test_result("DELETE /api/admin/uploads/:id", False, f"Unexpected response: {data}")
        else:
            test_result("DELETE /api/admin/uploads/:id", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("DELETE /api/admin/uploads/:id", False, f"Exception: {e}")
    
    # Test 27: DELETE /api/admin/uploads/:id (unknown id)
    try:
        r = requests.delete(f"{BASE_URL}/admin/uploads/unknown-upload-id", cookies=cookies, timeout=10)
        if r.status_code == 404:
            data = r.json()
            if data.get('error') == 'upload not found':
                test_result("DELETE /api/admin/uploads/:id (unknown id)", True, "Returns 404 upload not found")
            else:
                test_result("DELETE /api/admin/uploads/:id (unknown id)", False, f"Unexpected response: {data}")
        else:
            test_result("DELETE /api/admin/uploads/:id (unknown id)", False, f"Expected 404, got {r.status_code}: {r.text}")
    except Exception as e:
        test_result("DELETE /api/admin/uploads/:id (unknown id)", False, f"Exception: {e}")

else:
    print("⚠️  Skipping delete upload tests - no admin cookie or test upload available\n")

# ============================================================================
# PART 7: SESSION PERSISTENCE
# ============================================================================
print("\n" + "=" * 80)
print("PART 7: SESSION PERSISTENCE")
print("=" * 80 + "\n")

if admin_cookie:
    cookies = {'sk_admin': admin_cookie}
    
    # Test 28: Verify same cookie still works for multiple requests
    try:
        routes = ['/admin/stats', '/admin/custom-orders', '/admin/uploads']
        all_passed = True
        for route in routes:
            r = requests.get(f"{BASE_URL}{route}", cookies=cookies, timeout=10)
            if r.status_code != 200:
                all_passed = False
                break
        
        if all_passed:
            test_result("Session persistence", True, "Same cookie works for all admin endpoints")
        else:
            test_result("Session persistence", False, "Cookie failed for some endpoints")
    except Exception as e:
        test_result("Session persistence", False, f"Exception: {e}")

else:
    print("⚠️  Skipping session persistence test - no admin cookie available\n")

# ============================================================================
# PART 8: LOGOUT
# ============================================================================
print("\n" + "=" * 80)
print("PART 8: LOGOUT")
print("=" * 80 + "\n")

if admin_cookie:
    cookies = {'sk_admin': admin_cookie}
    
    # Test 29: POST /api/admin/logout
    try:
        r = requests.post(f"{BASE_URL}/admin/logout", cookies=cookies, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('ok'):
                test_result("POST /api/admin/logout", True, "Logged out successfully")
            else:
                test_result("POST /api/admin/logout", False, f"Unexpected response: {data}")
        else:
            test_result("POST /api/admin/logout", False, f"Status {r.status_code}: {r.text}")
    except Exception as e:
        test_result("POST /api/admin/logout", False, f"Exception: {e}")

else:
    print("⚠️  Skipping logout test - no admin cookie available\n")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Total tests: {tests_passed + tests_failed}")
print(f"✅ Passed: {tests_passed}")
print(f"❌ Failed: {tests_failed}")
print(f"Success rate: {tests_passed / (tests_passed + tests_failed) * 100:.1f}%")
print("=" * 80)
