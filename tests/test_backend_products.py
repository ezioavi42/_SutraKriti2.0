"""Backend tests for SutraKriti products + inventory (iteration 4)."""
import os, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://stock-admin-panel-2.preview.emergentagent.com").rstrip("/") + "/api"
ADMIN_PW = "sutrakriti-admin-dev"

# -------------------- Fixtures --------------------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE}/admin/login", json={"password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    assert s.cookies.get("sk_admin"), "sk_admin cookie not set"
    return s

@pytest.fixture(scope="session")
def created_product(admin_session):
    payload = {"name": "TEST_QA_Prod", "category": "Handbags", "price": 1500,
               "stockQuantity": 10, "lowStockThreshold": 3, "isActive": True}
    r = admin_session.post(f"{BASE}/admin/products", json=payload, timeout=15)
    assert r.status_code in (200, 201), r.text
    pid = r.json()["product"]["id"]
    yield pid
    admin_session.delete(f"{BASE}/admin/products/{pid}")

# -------------------- Public --------------------
def test_health():
    r = requests.get(f"{BASE}/health", timeout=10)
    assert r.status_code == 200 and r.json()["ok"] is True

def test_public_products_list():
    r = requests.get(f"{BASE}/products", timeout=15)
    assert r.status_code == 200
    products = r.json()["products"]
    assert len(products) >= 10
    p = products[0]
    for k in ("id", "name", "price", "stockQuantity", "lowStockThreshold", "isActive", "sortOrder", "images", "colors"):
        assert k in p, f"missing key {k}"
    # only active shown
    assert all(p["isActive"] for p in products)

def test_public_get_single_and_404():
    r = requests.get(f"{BASE}/products", timeout=15).json()["products"]
    pid = r[0]["id"]
    r2 = requests.get(f"{BASE}/products/{pid}", timeout=10)
    assert r2.status_code == 200 and r2.json()["product"]["id"] == pid
    r3 = requests.get(f"{BASE}/products/does-not-exist-xyz", timeout=10)
    assert r3.status_code == 404

# -------------------- Auth --------------------
def test_admin_me_unauth():
    r = requests.get(f"{BASE}/admin/me", timeout=10)
    assert r.status_code == 401

def test_admin_me_auth(admin_session):
    r = admin_session.get(f"{BASE}/admin/me", timeout=10)
    assert r.status_code == 200

# -------------------- Admin CRUD --------------------
def test_admin_products_lists_all(admin_session):
    r = admin_session.get(f"{BASE}/admin/products", timeout=15)
    assert r.status_code == 200
    assert len(r.json()["products"]) >= 10

def test_create_duplicate_returns_409(admin_session, created_product):
    r = admin_session.post(f"{BASE}/admin/products",
                           json={"id": created_product, "name": "dup"}, timeout=10)
    assert r.status_code == 409, r.text

def test_create_autoslug(admin_session):
    r = admin_session.post(f"{BASE}/admin/products",
                           json={"name": "TEST_AutoSlug One", "price": 100}, timeout=10)
    assert r.status_code in (200, 201)
    pid = r.json()["product"]["id"]
    assert "-" in pid or pid.lower() == pid
    admin_session.delete(f"{BASE}/admin/products/{pid}")

def test_patch_ignores_stock_direct(admin_session, created_product):
    r = admin_session.patch(f"{BASE}/admin/products/{created_product}",
                            json={"price": 1999, "stockQuantity": 9999,
                                  "description": "updated"}, timeout=10)
    assert r.status_code == 200, r.text
    prod = r.json()["product"]
    assert prod["price"] == 1999
    assert prod["stockQuantity"] != 9999, "stock should NOT change via PATCH"

def test_stock_delta_and_insufficient(admin_session, created_product):
    # get current
    prod = admin_session.get(f"{BASE}/admin/products/{created_product}").json()["product"]
    cur = prod["stockQuantity"]
    # insufficient
    r = admin_session.post(f"{BASE}/admin/products/{created_product}/stock",
                           json={"mode": "delta", "delta": -(cur + 100), "reason": "sale"}, timeout=10)
    assert r.status_code == 400
    assert "insufficient" in r.text.lower()
    # valid delta -3
    r = admin_session.post(f"{BASE}/admin/products/{created_product}/stock",
                           json={"mode": "delta", "delta": -3, "reason": "sale"}, timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    new_qty = body.get("newQuantity", body.get("resultingQuantity", body.get("resulting_quantity")))
    if new_qty is None:
        new_qty = admin_session.get(f"{BASE}/admin/products/{created_product}").json()["product"]["stockQuantity"]
    assert new_qty == cur - 3, f"expected {cur-3}, got {new_qty}, body={body}"

def test_stock_set_mode(admin_session, created_product):
    r = admin_session.post(f"{BASE}/admin/products/{created_product}/stock",
                           json={"mode": "set", "quantity": 15, "reason": "recount"}, timeout=10)
    assert r.status_code == 200, r.text
    prod = admin_session.get(f"{BASE}/admin/products/{created_product}").json()["product"]
    assert prod["stockQuantity"] == 15

def test_stock_movements(admin_session, created_product):
    r = admin_session.get(f"{BASE}/admin/products/{created_product}/stock/movements", timeout=10)
    assert r.status_code == 200
    moves = r.json()["movements"]
    assert len(moves) >= 2  # initial + adjustments
    # Newest first assertion: timestamps descending
    ts = [m.get("createdAt") or m.get("created_at") for m in moves]
    assert ts == sorted(ts, reverse=True)

def test_admin_stats_includes_products(admin_session):
    r = admin_session.get(f"{BASE}/admin/stats", timeout=10)
    assert r.status_code == 200
    prods = r.json().get("products") or r.json().get("stats", {}).get("products")
    assert prods is not None
    for k in ("total", "active", "totalStock", "outOfStock", "lowStock"):
        assert k in prods, f"missing stats key {k}"

def test_delete_cascades(admin_session):
    # create + delete + confirm 404
    r = admin_session.post(f"{BASE}/admin/products",
                           json={"name": "TEST_ToDelete", "price": 10}, timeout=10)
    pid = r.json()["product"]["id"]
    d = admin_session.delete(f"{BASE}/admin/products/{pid}")
    assert d.status_code == 200
    g = admin_session.get(f"{BASE}/admin/products/{pid}")
    assert g.status_code == 404
