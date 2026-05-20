# Supabase + Vercel Setup Guide (JJRK Studio)

Project ID: `eeagyngzbzcpqxptnqvy`  
Dashboard: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy

---

## ⚠️ IMPORTANT: Which key goes where?

| Key | Put in frontend? | Where to use |
|-----|------------------|--------------|
| **anon / public** | ✅ YES | `supabase-config.js` (already set) |
| **service_role / secret** | ❌ NEVER | Supabase Dashboard only — **do not** put in HTML, JS, Vercel public env, or GitHub |

The **service_role** key bypasses all security. If someone gets it, they can read/delete your whole database.

**You shared the secret key in chat — rotate it now:**  
Supabase → **Settings** → **API** → **Reset service_role key**

---

## Part 1: Supabase (database + auth)

### Step 1 — API keys (already in your project)

File: **`supabase-config.js`**

```javascript
const SUPABASE_URL = 'https://eeagyngzbzcpqxptnqvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // anon public only
```

✅ Your **anon public** key is already configured. No change needed unless you reset keys in Supabase.

### Step 2 — Create database tables

1. Open: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new  
2. Copy all of **`supabase-schema.sql`**  
3. Click **Run**  
4. Run **`fix-rls-policies.sql`** after (for admin login)  
5. Run **`images-schema-vercel.sql`** for site photos (optional but recommended)

### Step 3 — Auth settings (fix login/register)

1. **Authentication** → **Providers** → **Email**  
   - Turn **OFF** “Confirm email” (easiest for testing)  
   - Save  

2. **Authentication** → **URL Configuration**  

   See **`SUPABASE_REDIRECT_URLS.md`** for the full list. Minimum:

   **Site URL:** `https://YOUR-APP-NAME.vercel.app` (or `http://127.0.0.1:8080` for local)

   **Redirect URLs** (one per line):

   ```
   http://127.0.0.1:8080/**
   http://127.0.0.1:8080/auth/callback.html
   https://YOUR-APP-NAME.vercel.app/**
   https://YOUR-APP-NAME.vercel.app/auth/callback.html
   ```

   **Auth callback** = `/auth/callback.html` (handles email confirm + OAuth return)

### Step 4 — Confirm existing users (if already registered)

**Authentication** → **Users** → click user → **Confirm email**

### Step 5 — Admin user (optional)

After registering `admin@jjrkstudio.com` in the app:

```sql
UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
```

---

## Part 2: Deploy to Vercel

**Full checklist:** see **`VERCEL_DEPLOY_STEPS.md`** (build `public/`, `images/` folder, SQL order).

### Step 1 — Push code to GitHub

1. Create a repo on GitHub  
2. Push your `integ` folder:

```powershell
cd c:\Users\FRANZEN\Downloads\integ
git init
git add .
git commit -m "JJRK Studio with Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2 — Import project in Vercel

1. Go to https://vercel.com → **Add New** → **Project**  
2. Import your GitHub repository  
3. Settings:
   - **Framework Preset:** Other (static site)  
   - **Root Directory:** `.` (project root)  
   - **Build Command:** leave empty  
   - **Output Directory:** leave empty (or `.`)  
4. Click **Deploy**

Your site will be at: `https://something.vercel.app`

### Step 3 — Environment variables on Vercel (required)

Open **`VERCEL_ENV_VARIABLES.md`** — copy the 3 variables into Vercel → **Settings** → **Environment Variables**.

| Key | Value |
|-----|-------|
| `SUPABASE_PROJECT_ID` | `eeagyngzbzcpqxptnqvy` |
| `SUPABASE_URL` | `https://eeagyngzbzcpqxptnqvy.supabase.co` |
| `SUPABASE_ANON_KEY` | your anon public key |

Build command is already set: `npm run build` (generates `supabase-config.js`).

**Do NOT add `SUPABASE_SERVICE_ROLE`** — not used; unsafe for static sites.

### Step 4 — Update Supabase redirect URLs

After deploy, copy your Vercel URL (e.g. `https://jjrk-studio.vercel.app`).

Go back to Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://jjrk-studio.vercel.app`  
- **Redirect URLs:** add `https://jjrk-studio.vercel.app/**`

Save.

### Step 5 — Redeploy (if needed)

Vercel → your project → **Deployments** → **Redeploy** (after Supabase URL changes)

---

## Part 3: Test after deploy

1. `https://YOUR-APP.vercel.app/register.html` — register with **full email** (`name@gmail.com`)  
2. `https://YOUR-APP.vercel.app/login.html` — login (not username)  
3. Submit booking / contact form  
4. Admin: set `role = 1` in SQL, then `admin_dashboard.html`

Local test first:

```powershell
cd c:\Users\FRANZEN\Downloads\integ
npm start
```

Open http://127.0.0.1:8080

---

## Part 4: Images on Vercel (fix camera.jpg 404)

Unzip `images-20260520T124118Z-3-001.zip` into an **`images`** folder in the project root, then commit and push:

```
integ/
  images/
    camera.jpg
    ...
```

---

## Quick checklist

- [ ] `supabase-config.js` has **anon** key only (done)  
- [ ] SQL schema run in Supabase  
- [ ] `fix-rls-policies.sql` run  
- [ ] Confirm email OFF or users confirmed  
- [ ] Vercel redirect URLs added in Supabase  
- [ ] `images/` folder uploaded  
- [ ] **service_role** NOT in any frontend file  
- [ ] service_role **rotated** if it was shared publicly  

---

## Links

- Supabase project: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy  
- Supabase API settings: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/settings/api  
- Auth URL config: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/auth/url-configuration  
- Local dev: see `LOCALHOST.md`  
- Login issues: see `FIX_RATE_LIMIT.md`
