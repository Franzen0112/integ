# Run JJRK Studio on Localhost (Chrome)

Use **http://127.0.0.1:8080** — not `file://`. Supabase login/register only work reliably over HTTP.

Your **same Supabase project and accounts** work on localhost. No separate database is needed.

---

## 1. Start the local server

### Option A — Terminal (recommended)

**Windows (PowerShell):**
```powershell
cd c:\Users\FRANZEN\Downloads\integ
npm start
```

**Mac/Linux:**
```bash
cd c:/Users/FRANZEN/Downloads/integ
npm start
```

Then open Chrome:

- Home: http://127.0.0.1:8080/index.html
- Login: http://127.0.0.1:8080/login.html
- Register: http://127.0.0.1:8080/register.html

### Option B — VS Code / Cursor

1. Press **F5** (or Run → Start Debugging)
2. Choose **"JJRK Studio (Chrome + localhost)"**
3. The server starts automatically and Chrome opens the site

---

## 2. Supabase settings (required once)

So login, register, and email links work on localhost:

1. Open: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/auth/url-configuration

2. Set **Site URL** to:
   ```
   http://127.0.0.1:8080
   ```

3. Under **Redirect URLs**, add these lines (one per line) — see **`SUPABASE_REDIRECT_URLS.md`**:
   ```
   http://127.0.0.1:8080/**
   http://127.0.0.1:8080/auth/callback.html
   http://localhost:8080/**
   http://localhost:8080/auth/callback.html
   ```

4. Click **Save**

### "email rate limit exceeded" on Register

You tried to register too many times. **Do not register again** — your account is likely already in the database.

1. Open **Login**: http://127.0.0.1:8080/login.html (same email + password)
2. If login fails → Supabase → **Authentication** → **Users** → your user → **Confirm email**
3. Or turn **OFF** "Confirm email" under **Providers** → **Email** (best for local testing)
4. Wait ~1 hour if rate limit persists before requesting more emails

### Email confirmation (if login still fails after register)

- **Authentication** → **Providers** → **Email** → turn **OFF** “Confirm email” (easiest for testing), **or**
- **Authentication** → **Users** → open user → **Confirm email**

---

## 3. Test login on localhost

1. Start server (`npm start`)
2. Open http://127.0.0.1:8080/register.html — create an account (or use an existing one)
3. Open http://127.0.0.1:8080/login.html — log in with the same email/password
4. You should land on `dashboard.html` (or `admin_dashboard.html` if `role = 1`)

Admin role in SQL Editor:

```sql
UPDATE users SET role = 1 WHERE email = 'your-email@example.com';
```

Also run `fix-rls-policies.sql` if admin dashboard shows “access denied”.

---

## 4. Troubleshooting

| Problem | Fix |
|--------|-----|
| Blank page / 404 | Use `npm start`, not opening HTML files directly |
| “Database not ready” | Refresh page; check F12 console |
| Login fails, user in DB | Confirm email in Supabase or disable “Confirm email” |
| Email link goes to wrong site | Add redirect URLs in step 2 |
| Port 8080 in use | `set PORT=3000` then `npm start` (Windows) |

---

## Files added

- `server.js` — static file server on port 8080
- `package.json` — `npm start` script
- `.vscode/launch.json` — launch Chrome with server
- `.vscode/tasks.json` — auto-start server before debug
