# Test Credentials

## Admin Dashboard (`/admin`)
- URL: https://stock-admin-panel-2.preview.emergentagent.com/admin
- Password: `sutrakriti-admin-dev`
- Env var: `ADMIN_PASSWORD` in `.env`
- Auth cookie: `sk_admin` (HttpOnly, HMAC-signed, 7-day expiry)

## MySQL (local pod)
- Host: 127.0.0.1
- Port: 3306
- Database: `sutrakriti`
- User: `sutrakriti`
- Password: `sutrakriti_dev_pw`
- CLI: `mysql -usutrakriti -psutrakriti_dev_pw sutrakriti`
