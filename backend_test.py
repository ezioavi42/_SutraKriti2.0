#!/usr/bin/env python3
"""
SutraKriti Backend API Test Suite - MySQL Migration
Tests all backend endpoints after MongoDB → MySQL migration
"""

import requests
import json
import io
from datetime import datetime

# Configuration
BASE_URL = "https://premium-threads-332.preview.emergentagent.com/api"
UPLOAD_TOKEN = "sutrakriti-dev-upload-token"

# Test data
TEST_CUSTOM_ORDER = {
    "name": "Ananya Desai",
    "contact": "9876543210",
    "email": "ananya.desai@example.com",
    "productType": "Potli Bag",
    "colors": "Sage Green, Gold",
    "size": "Medium",
    "budget": "2500-3500",
    "occasion": "Festive Season",
    "referenceImage": "https://example.com/potli-ref.jpg",
    "notes": "Looking for traditional design with modern touch"
}

TEST_CONTACT = {
    "name": "Kavya Iyer",
    "email": "kavya.iyer@example.com",
    "message": "Your handcrafted pieces are absolutely stunning! I'd love to know more about custom orders for home decor items."
}

TEST_NEWSLETTER = {
    "email": "newsletter.subscriber@example.com"
}

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_health():
    """Test GET /api/health - should return db:true, mail:false"""
    print_test_header("GET /api/health - Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("ok"):
            print_result(False, "Expected ok:true")
            return False
        
        if not data.get("db"):
            print_result(False, "Expected db:true (MySQL connection)")
            return False
        
        if data.get("mail") != False:
            print_result(False, f"Expected mail:false (SMTP unconfigured), got {data.get('mail')}")
            return False
        
        print_result(True, "Health check passed: ok=true, db=true, mail=false")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_products_list():
    """Test GET /api/products - should return list of 8 products"""
    print_test_header("GET /api/products - Product List")
    
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if "products" not in data:
            print_result(False, "Response missing 'products' key")
            return False
        
        products = data["products"]
        print(f"Number of products: {len(products)}")
        
        if len(products) != 8:
            print_result(False, f"Expected 8 products, got {len(products)}")
            return False
        
        # Verify product structure
        required_fields = ["id", "name", "category", "price", "image", "description", "material", "dimensions", "care", "delivery"]
        sample_product = products[0]
        print(f"Sample product: {sample_product['name']} (ID: {sample_product['id']})")
        
        missing_fields = [field for field in required_fields if field not in sample_product]
        if missing_fields:
            print_result(False, f"Product missing fields: {missing_fields}")
            return False
        
        print_result(True, f"Successfully retrieved {len(products)} products with all required fields")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_single_product():
    """Test GET /api/products/:id - should return single product"""
    print_test_header("GET /api/products/:id - Single Product")
    
    try:
        # Test valid product ID
        product_id = "p-tote-terracotta"
        response = requests.get(f"{BASE_URL}/products/{product_id}", timeout=10)
        print(f"Testing valid ID '{product_id}': Status {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid ID, got {response.status_code}")
            return False
        
        data = response.json()
        if "product" not in data:
            print_result(False, "Response missing 'product' key")
            return False
        
        product = data["product"]
        print(f"Product found: {product['name']}")
        
        if product["id"] != product_id:
            print_result(False, f"Product ID mismatch: expected {product_id}, got {product['id']}")
            return False
        
        # Test invalid product ID
        invalid_id = "unknown-product-id"
        response = requests.get(f"{BASE_URL}/products/{invalid_id}", timeout=10)
        print(f"Testing invalid ID '{invalid_id}': Status {response.status_code}")
        
        if response.status_code != 404:
            print_result(False, f"Expected 404 for invalid ID, got {response.status_code}")
            return False
        
        print_result(True, "Valid ID returns 200 with product, invalid ID returns 404")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_custom_order():
    """Test POST /api/custom-order - should create custom order with emailStatus:'skipped'"""
    print_test_header("POST /api/custom-order - Custom Order Enquiry")
    
    try:
        # Test valid custom order
        response = requests.post(f"{BASE_URL}/custom-order", json=TEST_CUSTOM_ORDER, timeout=10)
        print(f"Valid order status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid order, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("ok") or not data.get("id"):
            print_result(False, f"Response missing 'ok' or 'id': {data}")
            return False
        
        # Check emailStatus is 'skipped' (SMTP not configured)
        if data.get("emailStatus") != "skipped":
            print_result(False, f"Expected emailStatus:'skipped', got '{data.get('emailStatus')}'")
            return False
        
        order_id = data["id"]
        print(f"✓ Order created with ID: {order_id}, emailStatus: {data['emailStatus']}")
        
        # Test missing required fields
        invalid_order = {"email": "test@example.com"}  # Missing name and contact
        response = requests.post(f"{BASE_URL}/custom-order", json=invalid_order, timeout=10)
        print(f"Missing fields status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing fields, got {response.status_code}")
            return False
        
        print_result(True, "Valid order creates record (200) with emailStatus:'skipped', missing fields returns 400")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_contact():
    """Test POST /api/contact - should store contact message"""
    print_test_header("POST /api/contact - Contact Form")
    
    try:
        # Test valid contact
        response = requests.post(f"{BASE_URL}/contact", json=TEST_CONTACT, timeout=10)
        print(f"Valid contact status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid contact, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_result(False, f"Response missing 'ok': {data}")
            return False
        
        print(f"✓ Contact message submitted successfully")
        
        # Test missing required fields
        invalid_contact = {"name": "Test"}  # Missing message
        response = requests.post(f"{BASE_URL}/contact", json=invalid_contact, timeout=10)
        print(f"Missing message status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing message, got {response.status_code}")
            return False
        
        print_result(True, "Valid contact creates record (200), missing fields returns 400")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_newsletter():
    """Test POST /api/newsletter - should subscribe email with upsert semantics"""
    print_test_header("POST /api/newsletter - Newsletter Subscription")
    
    try:
        # Test valid subscription (first time)
        response = requests.post(f"{BASE_URL}/newsletter", json=TEST_NEWSLETTER, timeout=10)
        print(f"First subscription status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid subscription, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_result(False, f"Response missing 'ok': {data}")
            return False
        
        print(f"✓ Newsletter subscription successful")
        
        # Test upsert semantics (same email again should not error)
        response = requests.post(f"{BASE_URL}/newsletter", json=TEST_NEWSLETTER, timeout=10)
        print(f"Duplicate subscription status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for duplicate subscription (upsert), got {response.status_code}")
            return False
        
        print(f"✓ Duplicate subscription handled correctly (upsert)")
        
        # Test missing email
        invalid_sub = {}
        response = requests.post(f"{BASE_URL}/newsletter", json=invalid_sub, timeout=10)
        print(f"Missing email status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing email, got {response.status_code}")
            return False
        
        print_result(True, "Valid email subscribes (200), upsert works, missing email returns 400")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_razorpay_order():
    """Test POST /api/razorpay/order - should return 503 when keys not configured"""
    print_test_header("POST /api/razorpay/order - Payment Order (Gated)")
    
    try:
        # Test with valid product ID - should return 503 because keys are empty
        valid_request = {"productId": "p-tote-terracotta"}
        response = requests.post(f"{BASE_URL}/razorpay/order", json=valid_request, timeout=10)
        print(f"Valid product (gated) status: {response.status_code}")
        
        if response.status_code != 503:
            print_result(False, f"Expected 503 for gated payment, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get("error") != "payment_unconfigured":
            print_result(False, f"Expected error 'payment_unconfigured', got {data.get('error')}")
            return False
        
        if "whatsappNumber" not in data:
            print_result(False, "Response missing 'whatsappNumber'")
            return False
        
        print(f"✓ Correct 503 response with whatsappNumber: {data['whatsappNumber']}")
        
        # Test with invalid product ID
        invalid_request = {"productId": "unknown-product"}
        response = requests.post(f"{BASE_URL}/razorpay/order", json=invalid_request, timeout=10)
        print(f"Invalid product status: {response.status_code}")
        
        if response.status_code != 404:
            print_result(False, f"Expected 404 for invalid product, got {response.status_code}")
            return False
        
        print_result(True, "Returns 503 payment_unconfigured (EXPECTED MVP behavior), 404 for invalid product")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_razorpay_verify():
    """Test POST /api/razorpay/verify - should validate required fields"""
    print_test_header("POST /api/razorpay/verify - Payment Verification")
    
    try:
        # Test missing fields
        invalid_request = {"razorpay_order_id": "order_123"}  # Missing payment_id and signature
        response = requests.post(f"{BASE_URL}/razorpay/verify", json=invalid_request, timeout=10)
        print(f"Missing fields status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing fields, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if "error" not in data:
            print_result(False, "Response missing 'error' key")
            return False
        
        print(f"✓ Correctly returns 400 for missing fields: {data['error']}")
        print_result(True, "Field validation working (400 for missing fields)")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_upload():
    """Test POST /api/upload - should handle file upload with token authentication"""
    print_test_header("POST /api/upload - File Upload")
    
    try:
        # Create a small test PNG (1x1 pixel red PNG)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
            0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        # Test 1: Valid upload with token
        files = {'file': ('test-product.png', io.BytesIO(png_data), 'image/png')}
        headers = {'x-upload-token': UPLOAD_TOKEN}
        response = requests.post(f"{BASE_URL}/upload", files=files, headers=headers, timeout=10)
        print(f"Valid upload with token status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid upload, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("ok") or not data.get("url"):
            print_result(False, f"Response missing 'ok' or 'url': {data}")
            return False
        
        print(f"✓ File uploaded successfully: {data['url']}")
        
        # Test 2: Upload without token (should return 401)
        files = {'file': ('test-product2.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
        print(f"Upload without token status: {response.status_code}")
        
        if response.status_code != 401:
            print_result(False, f"Expected 401 for missing token, got {response.status_code}")
            return False
        
        print(f"✓ Correctly rejected upload without token (401)")
        
        # Test 3: Upload with wrong mime type (should return 415)
        text_data = b"This is a text file, not an image"
        files = {'file': ('test.txt', io.BytesIO(text_data), 'text/plain')}
        headers = {'x-upload-token': UPLOAD_TOKEN}
        response = requests.post(f"{BASE_URL}/upload", files=files, headers=headers, timeout=10)
        print(f"Upload with wrong mime type status: {response.status_code}")
        
        if response.status_code != 415:
            print_result(False, f"Expected 415 for unsupported mime type, got {response.status_code}")
            return False
        
        print(f"✓ Correctly rejected unsupported mime type (415)")
        
        print_result(True, "Upload with token works (200), without token returns 401, wrong mime returns 415")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_custom_orders():
    """Test GET /api/admin/custom-orders - should return orders list"""
    print_test_header("GET /api/admin/custom-orders - Admin Orders List")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/custom-orders", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if "orders" not in data:
            print_result(False, "Response missing 'orders' key")
            return False
        
        orders = data["orders"]
        print(f"Number of orders: {len(orders)}")
        
        if len(orders) > 0:
            sample_order = orders[0]
            print(f"Sample order: {sample_order.get('name', 'N/A')} - {sample_order.get('contact', 'N/A')}")
        
        print_result(True, f"Successfully retrieved {len(orders)} orders from MySQL")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_uploads():
    """Test GET /api/admin/uploads - should return uploads list"""
    print_test_header("GET /api/admin/uploads - Admin Uploads List")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/uploads", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if "uploads" not in data:
            print_result(False, "Response missing 'uploads' key")
            return False
        
        uploads = data["uploads"]
        print(f"Number of uploads: {len(uploads)}")
        
        if len(uploads) > 0:
            sample_upload = uploads[0]
            print(f"Sample upload: {sample_upload.get('filename', 'N/A')} - {sample_upload.get('url', 'N/A')}")
        
        print_result(True, f"Successfully retrieved {len(uploads)} uploads from MySQL")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_newsletter():
    """Test GET /api/admin/newsletter - should return subscribers list"""
    print_test_header("GET /api/admin/newsletter - Admin Newsletter Subscribers")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/newsletter", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if "subscribers" not in data:
            print_result(False, "Response missing 'subscribers' key")
            return False
        
        subscribers = data["subscribers"]
        print(f"Number of subscribers: {len(subscribers)}")
        
        if len(subscribers) > 0:
            sample_sub = subscribers[0]
            print(f"Sample subscriber: {sample_sub.get('email', 'N/A')}")
        
        print_result(True, f"Successfully retrieved {len(subscribers)} subscribers from MySQL")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("SUTRAKRITI BACKEND API TEST SUITE - MySQL Migration")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Database: MySQL/MariaDB (127.0.0.1:3306, db='sutrakriti')")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run all tests in order
    results["GET /api/health"] = test_health()
    results["GET /api/products"] = test_get_products_list()
    results["GET /api/products/:id"] = test_get_single_product()
    results["POST /api/custom-order"] = test_custom_order()
    results["POST /api/contact"] = test_contact()
    results["POST /api/newsletter"] = test_newsletter()
    results["POST /api/razorpay/order"] = test_razorpay_order()
    results["POST /api/razorpay/verify"] = test_razorpay_verify()
    results["POST /api/upload"] = test_upload()
    results["GET /api/admin/custom-orders"] = test_admin_custom_orders()
    results["GET /api/admin/uploads"] = test_admin_uploads()
    results["GET /api/admin/newsletter"] = test_admin_newsletter()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print(f"{'='*80}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
