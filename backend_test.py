#!/usr/bin/env python3
"""
SutraKriti Backend API Test Suite
Tests all backend endpoints defined in /app/app/api/[[...path]]/route.js
"""

import requests
import json
from pymongo import MongoClient
import os
from datetime import datetime

# Configuration
BASE_URL = "https://premium-threads-332.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "sutrakriti"

# Test data
TEST_CUSTOM_ORDER = {
    "name": "Priya Sharma",
    "contact": "9876543210",
    "email": "priya.sharma@example.com",
    "productType": "Handbag",
    "colors": "Terracotta, Cream",
    "size": "Medium",
    "budget": "3000-4000",
    "occasion": "Wedding Gift",
    "referenceImage": "https://example.com/ref.jpg",
    "notes": "Need it by next month for my sister's wedding"
}

TEST_CONTACT = {
    "name": "Rahul Verma",
    "email": "rahul.verma@example.com",
    "message": "I love your crochet work! Can you create a custom blanket for my daughter's nursery?"
}

TEST_NEWSLETTER = {
    "email": "newsletter.test@example.com"
}

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def get_mongo_client():
    """Get MongoDB client"""
    try:
        client = MongoClient(MONGO_URL)
        return client[DB_NAME]
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return None

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
    """Test POST /api/custom-order - should create custom order"""
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
        if not data.get("ok") or not data.get("id"):
            print_result(False, f"Response missing 'ok' or 'id': {data}")
            return False
        
        order_id = data["id"]
        print(f"Order created with ID: {order_id}")
        
        # Verify in MongoDB
        db = get_mongo_client()
        if db is not None:
            order = db.custom_orders.find_one({"id": order_id})
            if not order:
                print_result(False, f"Order {order_id} not found in MongoDB")
                return False
            print(f"✓ Order verified in MongoDB: {order['name']} - {order['contact']}")
        
        # Test missing required fields
        invalid_order = {"email": "test@example.com"}  # Missing name and contact
        response = requests.post(f"{BASE_URL}/custom-order", json=invalid_order, timeout=10)
        print(f"Missing fields status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing fields, got {response.status_code}")
            return False
        
        print_result(True, "Valid order creates record (200), missing fields returns 400")
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
        
        print(f"Contact message submitted successfully")
        
        # Verify in MongoDB
        db = get_mongo_client()
        if db is not None:
            contact = db.contacts.find_one({"name": TEST_CONTACT["name"], "message": TEST_CONTACT["message"]})
            if not contact:
                print_result(False, "Contact not found in MongoDB")
                return False
            print(f"✓ Contact verified in MongoDB: {contact['name']}")
        
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
    """Test POST /api/newsletter - should subscribe email"""
    print_test_header("POST /api/newsletter - Newsletter Subscription")
    
    try:
        # Test valid subscription
        response = requests.post(f"{BASE_URL}/newsletter", json=TEST_NEWSLETTER, timeout=10)
        print(f"Valid subscription status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 for valid subscription, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_result(False, f"Response missing 'ok': {data}")
            return False
        
        print(f"Newsletter subscription successful")
        
        # Verify in MongoDB (upsert)
        db = get_mongo_client()
        if db is not None:
            subscriber = db.newsletter.find_one({"email": TEST_NEWSLETTER["email"]})
            if not subscriber:
                print_result(False, "Subscriber not found in MongoDB")
                return False
            print(f"✓ Subscriber verified in MongoDB: {subscriber['email']}")
        
        # Test missing email
        invalid_sub = {}
        response = requests.post(f"{BASE_URL}/newsletter", json=invalid_sub, timeout=10)
        print(f"Missing email status: {response.status_code}")
        
        if response.status_code != 400:
            print_result(False, f"Expected 400 for missing email, got {response.status_code}")
            return False
        
        print_result(True, "Valid email subscribes (200), missing email returns 400")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_razorpay_order():
    """Test POST /api/razorpay/order - should return 503 when keys not configured"""
    print_test_header("POST /api/razorpay/order - Payment Order (Unconfigured)")
    
    try:
        # Test with valid product ID - should return 503 because keys are empty
        valid_request = {"productId": "p-tote-terracotta"}
        response = requests.post(f"{BASE_URL}/razorpay/order", json=valid_request, timeout=10)
        print(f"Valid product (unconfigured keys) status: {response.status_code}")
        
        if response.status_code != 503:
            print_result(False, f"Expected 503 for unconfigured keys, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
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
        
        print_result(True, "Returns 503 with payment_unconfigured (expected MVP behavior), 404 for invalid product")
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
        
        print_result(True, f"Successfully retrieved {len(orders)} orders")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("SUTRAKRITI BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run all tests
    results["GET /api/products"] = test_get_products_list()
    results["GET /api/products/:id"] = test_get_single_product()
    results["POST /api/custom-order"] = test_custom_order()
    results["POST /api/contact"] = test_contact()
    results["POST /api/newsletter"] = test_newsletter()
    results["POST /api/razorpay/order"] = test_razorpay_order()
    results["POST /api/razorpay/verify"] = test_razorpay_verify()
    results["GET /api/admin/custom-orders"] = test_admin_custom_orders()
    
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
