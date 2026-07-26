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
  - task: "GET /api/health"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Health check endpoint returns ok:true, db:true (MySQL connection), mail:false (SMTP unconfigured)."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (MySQL): Returns 200 with { ok:true, db:true, mail:false }. MySQL connection verified, SMTP correctly reported as unconfigured."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Still working correctly after MySQL migration. Returns 200 with 8 products, all required fields present."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Still working correctly after MySQL migration. Valid ID returns 200, invalid ID returns 404."

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
      - working: "NA"
        agent: "main"
        comment: "Migrated to MySQL. Now stores in MySQL custom_orders table. Returns { ok:true, id:uuid, emailStatus:'skipped' } (SMTP unconfigured)."
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Valid request returns 200 { ok:true, id:<uuid>, emailStatus:'skipped' }. Missing fields returns 400. Data persists in MySQL custom_orders table. emailStatus:'skipped' is CORRECT (SMTP intentionally unconfigured)."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Valid request returns 200 { ok:true, id:<uuid> }. Missing fields returns 400. Data persists in MySQL contacts table."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Valid email returns 200 { ok:true }. Missing email returns 400. Upsert semantics working correctly (duplicate email does not error). Data persists in MySQL newsletter table."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Valid productId returns 503 { error:'payment_unconfigured', whatsappNumber:'917777932385' } as EXPECTED (Razorpay gated via NEXT_PUBLIC_BUY_NOW_ENABLED=false and missing keys). Invalid productId returns 404. This is CORRECT MVP behavior."

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
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Missing required fields returns 400 { error:'missing fields' }. Field validation working correctly. Updates MySQL payments table when keys are configured."

  - task: "POST /api/upload (file upload with token auth)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Handles multipart/form-data file upload. Requires header x-upload-token: sutrakriti-dev-upload-token. Accepts image/jpeg, image/png, image/webp, image/avif, image/gif. Max 8MB. Saves to public/products/ and records in MySQL uploads table."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (MySQL): Valid PNG upload with correct token returns 200 { ok:true, id:<uuid>, filename, url, size, mime }. Without token returns 401 { error:'unauthorised' }. Wrong mime type (text/plain) returns 415 { error:'unsupported mime type...' }. File saved to disk and record persisted in MySQL uploads table."

  - task: "POST /api/admin/login"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin login endpoint. Validates password against ADMIN_PASSWORD env var. Returns 200 { ok:true } + Set-Cookie: sk_admin=<HMAC-signed token>; HttpOnly; SameSite=Lax; Max-Age=604800 (7 days). Wrong password returns 401 { error:'invalid_credentials' }."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Wrong password returns 401 { error:'invalid_credentials' }. Correct password (sutrakriti-admin-dev) returns 200 { ok:true } with sk_admin cookie set. Cookie authentication working correctly."

  - task: "POST /api/admin/logout"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin logout endpoint. Returns 200 { ok:true } + Set-Cookie clearing sk_admin (Max-Age=0)."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Returns 200 { ok:true } and clears sk_admin cookie. Logout working correctly."

  - task: "GET /api/admin/me"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin session check endpoint. Returns 200 { authenticated:true } WITH valid sk_admin cookie, 401 { error:'unauthorised' } WITHOUT cookie."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Without cookie returns 401 { error:'unauthorised' }. With valid cookie returns 200 { authenticated:true }. Session validation working correctly."

  - task: "GET /api/admin/stats"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin dashboard stats endpoint. Requires sk_admin cookie. Returns 200 with { orders:{total,pending,accepted,completed}, uploads, newsletter, contacts, payments:{n,paid}, recent }."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 with all required keys (orders, uploads, newsletter, contacts, payments, recent). Cookie enforcement and data aggregation working correctly."

  - task: "GET /api/admin/custom-orders"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns most recent 200 custom orders (no auth in MVP)."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Returns 200 { orders: [...] } with array of custom orders sorted by createdAt descending. Successfully retrieved orders from MongoDB. No authentication required in MVP as specified."
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (MySQL): Returns 200 { orders:[...] } with custom orders from MySQL custom_orders table, sorted by created_at DESC, limit 200. Successfully retrieved 2 orders."
      - working: "NA"
        agent: "main"
        comment: "Added sk_admin cookie authentication. Now requires valid admin session. Supports ?status=new|accepted|completed|all query param for filtering."
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (Round 3 - Auth): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 { orders:[...] } with 3 orders. Status filtering tested with ?status=new (returns 2 orders). Cookie enforcement and filtering working correctly."

  - task: "GET /api/admin/uploads"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns most recent 200 uploads (no auth in MVP). Shows filename, url, mime, size_bytes, created_at."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (MySQL): Returns 200 { uploads:[...] } with uploads from MySQL uploads table, sorted by created_at DESC, limit 200. Successfully retrieved 2 uploads."
      - working: "NA"
        agent: "main"
        comment: "Added sk_admin cookie authentication. Now requires valid admin session."
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (Round 3 - Auth): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 { uploads:[...] } with 1 upload. Cookie enforcement working correctly."

  - task: "DELETE /api/admin/uploads/:id"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin endpoint to delete uploaded files. Requires sk_admin cookie. Deletes file from disk (public/products/) and removes record from MySQL uploads table. Returns 200 { ok:true } on success, 404 { error:'upload not found' } for unknown id."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Valid upload id returns 200 { ok:true } and file is deleted from disk and database. Unknown id returns 404 { error:'upload not found' }. Cookie enforcement working (401 without cookie). File deletion working correctly."

  - task: "GET /api/admin/contacts"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin endpoint to list contact form submissions. Requires sk_admin cookie. Returns most recent 500 contacts from MySQL contacts table."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 { contacts:[...] } with 2 contacts. Cookie enforcement working correctly."

  - task: "GET /api/admin/newsletter"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns most recent 500 newsletter subscribers (no auth in MVP). Shows email, subscribed_at."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (MySQL): Returns 200 { subscribers:[...] } with subscribers from MySQL newsletter table, sorted by subscribed_at DESC, limit 500. Successfully retrieved 2 subscribers."
      - working: "NA"
        agent: "main"
        comment: "Added sk_admin cookie authentication. Now requires valid admin session."
      - working: true
        agent: "testing"
        comment: "✅ RE-TESTED (Round 3 - Auth): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 { subscribers:[...] } with 1 subscriber. Cookie enforcement working correctly."

  - task: "GET /api/admin/payments"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin endpoint to list Razorpay payment records. Requires sk_admin cookie. Returns most recent 500 payments from MySQL payments table."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): Without cookie returns 401 { error:'unauthorised' }. With cookie returns 200 { payments:[...] } with 0 payments (no payments created yet). Cookie enforcement working correctly."

  - task: "POST /api/admin/custom-orders/:id/action"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Admin endpoint to perform actions on custom orders. Requires sk_admin cookie. Body: { action, note?, timeline?, sendEmail? } where action ∈ { 'accept', 'complete', 'reopen', 'note' }. Returns 200 { ok:true, order, status, emailStatus } on success, 400 for invalid action, 404 for unknown order id."
      - working: true
        agent: "testing"
        comment: "✅ TESTED (Round 3): All actions tested successfully. action='accept' → status='accepted', emailStatus='smtp_not_configured' (CORRECT - SMTP intentionally unconfigured). action='complete' → status='completed', completed_at populated. action='reopen' → status='new', accepted_at & completed_at nulled. action='note' → admin_note updated only. Invalid action returns 400 { error:'invalid action' }. Unknown order id returns 404 { error:'order not found' }. Cookie enforcement working (401 without cookie). All order action flows working correctly."

frontend:
  - task: "Luxury landing page (hero, story, collections, catalogue, why, personalisation, process, reviews, gallery, faq, newsletter, footer)"
    implemented: true
    working: false
    file: "app/page.js"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Manually verified via screenshots — hero morphing word, palette, sections render correctly."
      - working: false
        agent: "testing"
        comment: "CRITICAL: Products not rendering. /api/products returns 500 (MariaDB not installed/running - ECONNREFUSED 127.0.0.1:3306). Featured Collections and Catalogue sections show only headings, ZERO product cards. Hydration fix VERIFIED WORKING (no console errors). Mobile layout fix CANNOT BE VERIFIED until database is fixed. Tested desktop (1920×1080) and mobile (390×844) - same issue on both."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "Luxury landing page (hero, story, collections, catalogue, why, personalisation, process, reviews, gallery, faq, newsletter, footer)"
  stuck_tasks:
    - "Luxury landing page (hero, story, collections, catalogue, why, personalisation, process, reviews, gallery, faq, newsletter, footer)"
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: |
      ❌ CRITICAL INFRASTRUCTURE FAILURE - TESTING BLOCKED
      
      Attempted to verify TWO bug fixes (hydration mismatch + mobile collections visibility).
      
      **RESULTS:**
      ✅ Issue 1 (Hydration): VERIFIED FIXED
         - Tested desktop (1920×1080) and mobile (390×844) viewports
         - Performed multiple page loads and reloads
         - ZERO hydration errors in console
         - No "server rendered HTML didn't match" warnings
         - No "yarn-particle" style mismatches
         - YarnParticles and PhilosophySparkles client-only rendering working correctly
      
      ❌ Issue 2 (Mobile Collections): CANNOT VERIFY - DATABASE DOWN
         - /api/products returns HTTP 500 (Internal Server Error)
         - Console shows: "Failed to load resource: the server responded with a status of 500"
         - Backend logs show: "Error: connect ECONNREFUSED 127.0.0.1:3306"
         - Root cause: MariaDB is NOT INSTALLED or NOT RUNNING
         - Supervisor status: `mariadb FATAL can't find command '/usr/sbin/mariadbd'`
         - Result: ZERO products render in Featured Collections or Catalogue sections
         - Only section headings visible, no product cards at all
      
      **DIAGNOSIS:**
      The backend was migrated to MySQL/MariaDB in previous rounds (per test_result.md history),
      but MariaDB is not currently installed on the system. The backend code calls initSchema()
      on every API request, which tries to connect to MySQL on 127.0.0.1:3306 and fails with
      ECONNREFUSED, causing all /api/products requests to return 500.
      
      MongoDB IS running (supervisor shows RUNNING), but the backend code is configured for MySQL.
      
      **REQUIRED ACTION:**
      1. Install and start MariaDB/MySQL, OR
      2. Revert backend to use MongoDB (which is running), OR
      3. Fix the database connection configuration
      
      Cannot complete mobile layout verification until products API is functional.
      
      Screenshots captured showing empty product sections at:
      - .screenshots/desktop-collections.png
      - .screenshots/mobile-collections.png
      - .screenshots/mobile-catalogue.png
  
  - agent: "main"
    message: |
      BUG FIX — Please verify TWO reported issues have been resolved.

      Base URL for testing: NEXT_PUBLIC_BASE_URL from /app/.env

      ISSUE 1: Hydration mismatch console error (React "server rendered HTML didn't match client")
        Root cause was:
          a) `YarnParticles` used Math.random() inside useMemo which produced different values on
             server vs client (visible in the huge diff in the report — width/height/left/top all
             mismatched).
          b) Philosophy section decorative sparkles used Math.cos/sin without rounding, producing
             floating-point drift (e.g. left: "27%" vs "27.000000000000007%").
        Fix:
          - Both YarnParticles and PhilosophySparkles are now client-only components: they render
            nothing during SSR (return null) and populate their items inside a useEffect. This
            guarantees the SSR HTML has no random/floating-point values, so there is nothing to
            mismatch on hydration.
          - Sparkles positions are additionally rounded via .toFixed(4).
        Please verify by loading the storefront home page (both desktop 1920x1080 AND mobile 390x844)
        with the browser console open and confirm there are ZERO hydration warnings and ZERO
        "server rendered HTML didn't match" errors. Perform a couple of full reloads.

      ISSUE 2: Featured Collections invisible on mobile viewports
        Root cause: the featured-collections grid was `grid md:grid-cols-6` with per-item classes
        `md:col-span-4 ... aspect-[16/13]` (or `md:col-span-2 aspect-square`) — the aspect ratios
        were only applied at md+ breakpoints, so on mobile the buttons had no height. Compounded
        with the hydration bailout, the section appeared empty on phones.
        Fix:
          - Grid is now `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5 md:gap-6`.
          - Buttons carry `w-full aspect-square` as their mobile default; only the hero-card
            promotes to `sm:col-span-2 md:col-span-4 md:row-span-2 md:aspect-[16/13]`.
        Please verify by loading the site at mobile viewport (390x844 iPhone-like) and confirming
        that the Featured Collections section shows all 6 cards (Terracotta Tote, Ivory Market
        Tote, Golden Wedding Potli, Everlasting White Blossom Bouquet, Wildflower Posy, Bouquet
        Blanket) each with a visible product image, category, name and price. Also confirm the
        Full Catalogue section below shows 8 product tiles in a 2-column grid on mobile.

      Do NOT test other flows. This is specifically a bug-fix verification for these two issues.
      IMPORTANT: `/api/products` is DB-backed but the products list itself is static (from
      lib/products.js). MariaDB is running under supervisor; if a card fails to appear because
      the products fetch failed, that would indicate the DB is not running — check /api/health.

      1) POST /api/custom-order now REQUIRES a valid email (previously optional).
         - Missing email → 400 { error:'email required' }
         - Malformed email (e.g. "abc") → 400 { error:'invalid email' }
         - Valid body (with email + name + contact) → 200 { ok:true, id, emailStatus, customerEmailStatus }
           * SMTP is intentionally unconfigured → BOTH emailStatus and customerEmailStatus should be 'skipped'.
           * If SMTP were configured, emailStatus would be 'sent' (studio notification) and
             customerEmailStatus would be 'sent' (auto-acknowledgement to the customer's email).
      2) All other endpoints unchanged from round 3 — please re-run the full regression suite
         (public + admin auth + admin actions + upload) to confirm nothing broke.

      Same caveats as before:
       - Do NOT flag 'skipped' / 'smtp_not_configured' email statuses as failures.
       - Do NOT flag /api/razorpay/order returning 503 as a failure.

      Admin password remains 'sutrakriti-admin-dev'. All admin flows unchanged.

      NEW/CHANGED endpoints to test (base = NEXT_PUBLIC_BASE_URL + /api):

      Public flows (unchanged, retest to confirm):
        - GET  /api/health → { ok:true, db:true, mail:false }
        - GET  /api/products → 8 items (one now renamed to "Wildflower Posy")
        - POST /api/custom-order → 200 { ok:true, id, emailStatus:'skipped' }
        - POST /api/newsletter, POST /api/contact
        - POST /api/upload (needs x-upload-token: sutrakriti-dev-upload-token)
        - POST /api/razorpay/order → 503 payment_unconfigured (INTENTIONAL — do not flag)

      NEW admin auth:
        - POST /api/admin/login  { password }
            password="sutrakriti-admin-dev" (from ADMIN_PASSWORD in .env)
            correct pw → 200 { ok:true } + Set-Cookie: sk_admin=<token>; HttpOnly; SameSite=Lax
            wrong pw   → 401 { error:'invalid_credentials' }
        - POST /api/admin/logout → 200 { ok:true } + Set-Cookie clearing sk_admin
        - GET  /api/admin/me → 200 { authenticated:true } WITH cookie, 401 WITHOUT

      Cookie enforcement — WITHOUT the sk_admin cookie every /admin/* route must return 401:
        - GET  /api/admin/stats
        - GET  /api/admin/custom-orders
        - GET  /api/admin/uploads
        - GET  /api/admin/contacts
        - GET  /api/admin/newsletter
        - GET  /api/admin/payments
        - POST /api/admin/custom-orders/:id/action
        - DELETE /api/admin/uploads/:id

      WITH the cookie (after login):
        - GET  /api/admin/stats → 200 with keys { orders:{total,pending,accepted,completed}, uploads, newsletter, contacts, payments:{n,paid}, recent }
        - GET  /api/admin/custom-orders → 200 { orders:[…] }
        - GET  /api/admin/custom-orders?status=new → filters
        - GET  /api/admin/uploads, /admin/contacts, /admin/newsletter, /admin/payments → 200 lists

      Order actions on POST /api/admin/custom-orders/:id/action:
        Body { action, note?, timeline?, sendEmail? } where action ∈ { 'accept', 'complete', 'reopen', 'note' }.
        Prereq: create a custom order first via POST /api/custom-order with an email so that acceptance email flow can be exercised.
        Expected behavior:
          - action='accept' → status becomes 'accepted', accepted_at populated, admin_note updated.
              With sendEmail=true and NO SMTP configured, response contains emailStatus:'smtp_not_configured' (this is CORRECT — SMTP intentionally blank).
              If order has no email → emailStatus:'no_email'.
          - action='complete' → status becomes 'completed', completed_at populated.
          - action='reopen'   → status back to 'new', accepted_at & completed_at nulled.
          - action='note'     → admin_note updated; other fields unchanged.
          - Invalid action → 400.
          - Unknown order id → 404.

      DELETE /api/admin/uploads/:id → 200 { ok:true } and file removed from public/products/. Unknown id → 404.

      Admin password is 'sutrakriti-admin-dev'. Session cookie name is 'sk_admin' (HMAC-signed, 7-day max age).

      Do NOT flag as failures:
        - emailStatus:'skipped'/'smtp_not_configured' from custom-order/accept (SMTP intentionally blank).
        - /api/razorpay/order returning 503 (intentional MVP gate).
  
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

  - agent: "testing"
    message: |
      ✅ ALL BACKEND TESTS PASSED AFTER MySQL MIGRATION (12/12 - 100%)
      
      Comprehensive re-testing completed after MongoDB → MySQL migration:
      
      1. ✅ GET /api/health - Returns ok:true, db:true (MySQL), mail:false (SMTP unconfigured)
      2. ✅ GET /api/products - Returns 8 products (static catalogue, no DB dependency)
      3. ✅ GET /api/products/:id - Valid ID returns 200, invalid returns 404
      4. ✅ POST /api/custom-order - Creates order in MySQL, returns emailStatus:'skipped' (CORRECT)
      5. ✅ POST /api/contact - Stores contact in MySQL contacts table
      6. ✅ POST /api/newsletter - Upserts email in MySQL newsletter table (duplicate handling works)
      7. ✅ POST /api/razorpay/order - Returns 503 payment_unconfigured (EXPECTED, gated)
      8. ✅ POST /api/razorpay/verify - Field validation working (400 for missing fields)
      9. ✅ POST /api/upload - Token auth works (200 with token, 401 without, 415 wrong mime)
      10. ✅ GET /api/admin/custom-orders - Returns orders from MySQL (2 orders retrieved)
      11. ✅ GET /api/admin/uploads - Returns uploads from MySQL (2 uploads retrieved)
      12. ✅ GET /api/admin/newsletter - Returns subscribers from MySQL (2 subscribers retrieved)
      
      All endpoints tested against https://premium-threads-332.preview.emergentagent.com/api
      MySQL integration verified for all data persistence operations.
      Schema auto-creation working correctly (custom_orders, contacts, newsletter, payments, uploads tables).
      
      IMPORTANT NOTES:
      - emailStatus:'skipped' is CORRECT behavior (SMTP intentionally unconfigured in dev)
      - 503 payment_unconfigured is CORRECT behavior (Razorpay gated via NEXT_PUBLIC_BUY_NOW_ENABLED=false)
      - Upload token authentication working correctly (x-upload-token: sutrakriti-dev-upload-token)
      
      No critical issues found. Backend is production-ready for MVP after MySQL migration.

  - agent: "testing"
    message: |
      ✅ ALL BACKEND TESTS PASSED - ROUND 3 ADMIN DASHBOARD (35/35 - 100%)
      
      Comprehensive testing completed on admin authentication and all admin dashboard endpoints:
      
      PUBLIC ENDPOINTS (RE-TESTED - 8/8 PASSED):
      1. ✅ GET /api/health - Returns { ok:true, db:true, mail:false }
      2. ✅ GET /api/products - Returns 8 products
      3. ✅ POST /api/custom-order - Creates order, emailStatus:'skipped' (CORRECT)
      4. ✅ POST /api/newsletter - Subscribes email successfully
      5. ✅ POST /api/contact - Stores contact successfully
      6. ✅ POST /api/razorpay/order - Returns 503 payment_unconfigured (CORRECT)
      7. ✅ POST /api/upload (with token) - Uploads file successfully
      8. ✅ POST /api/upload (without token) - Returns 401 unauthorised (CORRECT)
      
      ADMIN AUTHENTICATION (4/4 PASSED):
      9. ✅ POST /api/admin/login (wrong password) - Returns 401 invalid_credentials
      10. ✅ POST /api/admin/login (correct password) - Returns 200, sets sk_admin cookie
      11. ✅ GET /api/admin/me (without cookie) - Returns 401 unauthorised
      12. ✅ GET /api/admin/me (with cookie) - Returns 200 authenticated:true
      
      COOKIE ENFORCEMENT (6/6 PASSED):
      All /admin/* routes correctly return 401 WITHOUT sk_admin cookie:
      13. ✅ GET /api/admin/stats - 401 without cookie
      14. ✅ GET /api/admin/custom-orders - 401 without cookie
      15. ✅ GET /api/admin/uploads - 401 without cookie
      16. ✅ GET /api/admin/contacts - 401 without cookie
      17. ✅ GET /api/admin/newsletter - 401 without cookie
      18. ✅ GET /api/admin/payments - 401 without cookie
      
      ADMIN ENDPOINTS WITH COOKIE (7/7 PASSED):
      19. ✅ GET /api/admin/stats - Returns dashboard stats (orders, uploads, newsletter, contacts, payments, recent)
      20. ✅ GET /api/admin/custom-orders - Returns 3 orders
      21. ✅ GET /api/admin/custom-orders?status=new - Returns 2 new orders (filtering works)
      22. ✅ GET /api/admin/uploads - Returns 1 upload
      23. ✅ GET /api/admin/contacts - Returns 2 contacts
      24. ✅ GET /api/admin/newsletter - Returns 1 subscriber
      25. ✅ GET /api/admin/payments - Returns 0 payments
      
      ORDER ACTIONS (6/6 PASSED):
      26. ✅ POST /api/admin/custom-orders/:id/action (accept) - Status='accepted', emailStatus='smtp_not_configured' (CORRECT)
      27. ✅ POST /api/admin/custom-orders/:id/action (complete) - Status='completed', completed_at populated
      28. ✅ POST /api/admin/custom-orders/:id/action (reopen) - Status='new', accepted_at & completed_at nulled
      29. ✅ POST /api/admin/custom-orders/:id/action (note) - admin_note updated only
      30. ✅ POST /api/admin/custom-orders/:id/action (invalid action) - Returns 400 invalid action
      31. ✅ POST /api/admin/custom-orders/:id/action (unknown id) - Returns 404 order not found
      
      FILE DELETION (2/2 PASSED):
      32. ✅ DELETE /api/admin/uploads/:id - Deletes file from disk and database
      33. ✅ DELETE /api/admin/uploads/:id (unknown id) - Returns 404 upload not found
      
      SESSION MANAGEMENT (2/2 PASSED):
      34. ✅ Session persistence - Same cookie works for all admin endpoints
      35. ✅ POST /api/admin/logout - Clears cookie successfully
      
      All endpoints tested against https://premium-threads-332.preview.emergentagent.com/api
      
      CRITICAL VALIDATIONS CONFIRMED:
      - ✅ Admin password authentication working (sutrakriti-admin-dev)
      - ✅ HMAC-signed cookie (sk_admin) with 7-day expiry working correctly
      - ✅ Cookie enforcement on all /admin/* routes (except /admin/login) working
      - ✅ Session persistence across multiple requests working
      - ✅ Order action workflows (accept → complete → reopen → note) working
      - ✅ emailStatus:'smtp_not_configured' is CORRECT (SMTP intentionally unconfigured)
      - ✅ File upload and deletion working correctly
      - ✅ Status filtering on custom orders working
      - ✅ All error cases (401, 400, 404) handled correctly
      
      No critical issues found. Admin dashboard backend is fully functional and production-ready.
