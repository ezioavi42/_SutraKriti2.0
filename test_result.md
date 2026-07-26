#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build SutraKriti — a luxury boutique handcrafted crochet brand website with premium hero animation,
  brand story, featured collections, product catalogue, custom order enquiry, WhatsApp ordering,
  Razorpay checkout, reviews, gallery, FAQ, newsletter. Warm earthy palette, elegant serif +
  modern sans typography, Framer Motion animations.

backend:
  - task: "GET /api/products list"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns hardcoded product catalogue (8 products across Handbags, Potli Bags, Flowers, Home Decor)."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Returns 200 with { products: [...] } containing 8 products. All products have required fields: id, name, category, price, image, description, material, dimensions, care, delivery. Sample: Terracotta Tote Bag (p-tote-terracotta)."

  - task: "GET /api/products/:id single product"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns single product by id, 404 if not found."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Valid ID (p-tote-terracotta) returns 200 with { product: {...} }. Invalid ID (unknown-product-id) returns 404 with { error: 'not found' }. Both paths working correctly."

  - task: "POST /api/custom-order (custom enquiry)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Stores custom_orders in MongoDB. Requires name + contact. Returns id."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Valid request with name/contact returns 200 { ok: true, id: <uuid> }. Missing required fields returns 400 { error: 'name and contact required' }. Record successfully inserted and verified in MongoDB custom_orders collection."

  - task: "POST /api/contact"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Stores contact messages. Requires name + message."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Valid request with name/message returns 200 { ok: true }. Missing required fields returns 400 { error: 'name and message required' }. Record successfully inserted and verified in MongoDB contacts collection."

  - task: "POST /api/newsletter (subscribe)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Upserts subscriber email into newsletter collection."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Valid request with email returns 200 { ok: true }. Missing email returns 400 { error: 'email required' }. Upsert operation successfully verified in MongoDB newsletter collection."

  - task: "POST /api/razorpay/order (create order, gated on env keys)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Creates Razorpay order and persists a payment doc. When RAZORPAY_KEY_ID/SECRET are
          not configured, returns HTTP 503 with { error: 'payment_unconfigured', whatsappNumber }
          — this is intentional so frontend falls back to WhatsApp ordering until keys are added.
      - working: true
        agent: "testing"
        comment: "✅ TESTED: With valid productId (p-tote-terracotta), returns 503 { error: 'payment_unconfigured', whatsappNumber: '917777932385', message: '...' } as expected (RAZORPAY_KEY_ID/SECRET are empty in .env). With invalid productId, returns 404 { error: 'product not found' }. This is correct MVP behavior for fallback to WhatsApp ordering."

  - task: "POST /api/razorpay/verify (signature verification)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          HMAC SHA256 signature verification of razorpay_order_id + '|' + razorpay_payment_id.
          Updates payment status to 'paid' or 'failed'. Only executable with valid Razorpay keys.
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Missing required fields (razorpay_order_id, razorpay_payment_id, razorpay_signature) returns 400 { error: 'missing fields' }. Field validation working correctly. Full signature verification requires live Razorpay keys and cannot be tested in MVP."

  - task: "GET /api/admin/custom-orders"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns most recent 200 custom orders (no auth in MVP)."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Returns 200 { orders: [...] } with array of custom orders sorted by createdAt descending. Successfully retrieved orders from MongoDB. No authentication required in MVP as specified."

frontend:
  - task: "Luxury landing page (hero, story, collections, catalogue, why, personalisation, process, reviews, gallery, faq, newsletter, footer)"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Manually verified via screenshots — hero morphing word, palette, sections render correctly."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Backend endpoints ready. Please test:
        - GET  /api/products  → should return { products: [...] } with 8 items.
        - GET  /api/products/p-tote-terracotta → { product: {...} }; unknown id → 404.
        - POST /api/custom-order with { name, contact, email?, productType?, ... } → 200 { ok:true, id }.
              Missing name/contact → 400.
        - POST /api/newsletter with { email } → 200 { ok:true }. Missing email → 400.
        - POST /api/contact with { name, message } → 200 { ok:true }. Missing → 400.
        - POST /api/razorpay/order with { productId } → because RAZORPAY_KEY_ID/SECRET are
              intentionally empty in .env, this MUST return HTTP 503 with
              { error: 'payment_unconfigured', whatsappNumber }. This is expected MVP behaviour
              (fallback to WhatsApp) — do NOT flag as failure.
        - POST /api/razorpay/verify — cannot be fully tested without live signature; verify that
              missing fields → 400.
      MongoDB is used via MONGO_URL + DB_NAME='sutrakriti'.
  
  - agent: "testing"
    message: |
      ✅ ALL BACKEND TESTS PASSED (8/8 - 100%)
      
      Comprehensive testing completed on all SutraKriti backend API endpoints:
      
      1. ✅ GET /api/products - Returns 8 products with all required fields
      2. ✅ GET /api/products/:id - Valid ID returns product, invalid returns 404
      3. ✅ POST /api/custom-order - Creates order in MongoDB, validates required fields
      4. ✅ POST /api/contact - Stores contact in MongoDB, validates required fields
      5. ✅ POST /api/newsletter - Upserts email in MongoDB, validates required fields
      6. ✅ POST /api/razorpay/order - Returns 503 payment_unconfigured (expected MVP behavior)
      7. ✅ POST /api/razorpay/verify - Field validation working (400 for missing fields)
      8. ✅ GET /api/admin/custom-orders - Returns orders array from MongoDB
      
      All endpoints tested against https://premium-threads-332.preview.emergentagent.com/api
      MongoDB integration verified for all data persistence operations.
      No critical issues found. Backend is production-ready for MVP.
