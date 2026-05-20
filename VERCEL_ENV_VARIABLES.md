# Vercel Environment Variables — Ready to Copy

Project: **eeagyngzbzcpqxptnqvy**

Vercel → your project → **Settings** → **Environment Variables** → Add each row below.

Enable for: **Production**, **Preview**, and **Development** (check all three).

---

## Add these variables (browser / build)

| Key | Value |
|-----|-------|
| `SUPABASE_PROJECT_ID` | `eeagyngzbzcpqxptnqvy` |
| `SUPABASE_URL` | `https://eeagyngzbzcpqxptnqvy.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWd5bmd6YnpjcHF4cHRucXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzk1MTUsImV4cCI6MjA4Mjg1NTUxNX0.PY_4TUkQoDvwhUKyYl2lIcCvfA6mgCStp9h657IMq0g` |

Copy-paste form:

```
SUPABASE_PROJECT_ID=eeagyngzbzcpqxptnqvy
SUPABASE_URL=https://eeagyngzbzcpqxptnqvy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWd5bmd6YnpjcHF4cHRucXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzk1MTUsImV4cCI6MjA4Mjg1NTUxNX0.PY_4TUkQoDvwhUKyYl2lIcCvfA6mgCStp9h657IMq0g
```

---

## Do NOT add service_role for this static site

| Key | Add to Vercel? |
|-----|----------------|
| `SUPABASE_SERVICE_ROLE` | **NO** — not used by this app. Exposing it in the browser would allow anyone to delete your database. |

If you already shared the secret key publicly, **rotate it** in Supabase → Settings → API.

---

## Vercel build settings

After adding env vars:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build` |
| **Output Directory** | `.` (root) or leave empty |
| **Install Command** | `npm install` (optional, no deps required) |

`npm run build` runs `scripts/generate-supabase-config.js` and writes `supabase-config.js` using the variables above.

---

## After saving env vars

1. **Deployments** → **Redeploy** (required for new env vars to apply)
2. Supabase → **URL Configuration** → add `https://YOUR-APP.vercel.app/auth/callback.html` (see `SUPABASE_REDIRECT_URLS.md`)
3. Test: `https://YOUR-APP.vercel.app/login.html`

---

## Local `.env` (optional)

Copy `.env.example` to `.env` (gitignored), then:

```powershell
npm run build
npm start
```
