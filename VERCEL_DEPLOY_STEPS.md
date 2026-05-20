# Vercel Deploy — Step by Step (JJRK Studio)

Gamiton kining order. Human sa Step A–C, i-follow ang **Deploy** (D–H).

---

## A. Extract photos (local, one time)

```powershell
cd c:\Users\FRANZEN\Downloads\integ
node scripts/extract-images.js
```

Check: naa ang `images\wedding.jpg`, `images\jjrk.png`, etc. (dili `images\images\`).

---

## B. Supabase SQL (run sa SQL Editor)

https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new

Run **one file at a time**, in order:

| # | File |
|---|------|
| 1 | `supabase-schema.sql` |
| 2 | `fix-rls-policies.sql` |
| 3 | `messaging-schema.sql` (kung gusto messaging) |
| 4 | `fix-messaging-rls.sql` (kung na-run ang messaging) |
| 5 | **`images-schema-vercel.sql`** ← pictures / Vercel |

Human run #5, makita sa results ang lista sa `slug` ug `fallback_path`.

**Admin account** (after register sa site):

```sql
UPDATE users SET role = 1 WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
```

---

## C. Push code to GitHub (kung wala pa)

Sa project folder:

```powershell
cd c:\Users\FRANZEN\Downloads\integ
git init
git add .
git commit -m "JJRK Studio ready for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Siguruha nga na-include ang **`images/`** folder (dili lang ang `.zip`).

---

## D. Create / open Vercel project

1. Adto: https://vercel.com/dashboard  
2. **Add New** → **Project**  
3. **Import** ang GitHub repo (`integ` o imong repo name)  
4. Framework: **Other** (static site)

---

## E. Vercel build settings (automatic gikan sa `vercel.json`)

| Setting | Value |
|---------|--------|
| **Build Command** | `npm run build` |
| **Output Directory** | `public` |
| **Install Command** | *(biyai blank)* |

Ayaw usba kung naka-match na sa table.

---

## F. Environment variables (required)

Vercel project → **Settings** → **Environment Variables**

Add **3 variables**. Check **Production**, **Preview**, ug **Development**:

| Name | Value |
|------|--------|
| `SUPABASE_PROJECT_ID` | `eeagyngzbzcpqxptnqvy` |
| `SUPABASE_URL` | `https://eeagyngzbzcpqxptnqvy.supabase.co` |
| `SUPABASE_ANON_KEY` | *(anon key gikan sa Supabase → Settings → API)* |

**Do NOT** add `SUPABASE_SERVICE_ROLE` sa Vercel.

Copy-paste:

```
SUPABASE_PROJECT_ID=eeagyngzbzcpqxptnqvy
SUPABASE_URL=https://eeagyngzbzcpqxptnqvy.supabase.co
SUPABASE_ANON_KEY=paste_your_anon_key_here
```

Anon key: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/settings/api

---

## G. Deploy

1. Click **Deploy** (first time)  
   **OR** **Deployments** → **⋯** → **Redeploy** (kung na-update na ang env vars)

2. Wait until status **Ready**

3. Copy ang URL, e.g. `https://integ-ivory.vercel.app`

---

## H. Supabase redirect URLs (after you know Vercel URL)

Supabase → **Authentication** → **URL Configuration**

| Field | Value |
|-------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` |
| **Redirect URLs** | Add lines below |

```
https://YOUR-APP.vercel.app/**
https://YOUR-APP.vercel.app/auth/callback.html
http://127.0.0.1:8080/**
http://127.0.0.1:8080/auth/callback.html
```

Replace `YOUR-APP` sa imong real Vercel subdomain. **Save**.

---

## I. Test on live site

| Test | URL |
|------|-----|
| Home | `https://YOUR-APP.vercel.app/dashboard.html` |
| Login | `https://YOUR-APP.vercel.app/login.html` |
| About (team photos) | `https://YOUR-APP.vercel.app/about_us.html` |
| Offers | `https://YOUR-APP.vercel.app/product.html` |
| Admin | Login as admin → `admin_dashboard.html` |

**Photos:** Kung broken ang image, open `https://YOUR-APP.vercel.app/images/wedding.jpg` — kung 404, wala na-upload ang `images/` folder sa Git / deploy.

**Admin upload:** Admin Dashboard → **Site Images** → Change photo (kinahanglan na-run ang `images-schema-vercel.sql`).

---

## J. Every next update (redeploy)

```powershell
git add .
git commit -m "Update site"
git push
```

Vercel auto-deploy gikan sa GitHub. Or manual: **Deployments** → **Redeploy**.

---

## Quick checklist

- [ ] `images/` folder naa sa repo (15+ files)  
- [ ] `images-schema-vercel.sql` na-run sa Supabase  
- [ ] 3 env vars sa Vercel (`SUPABASE_*`)  
- [ ] Redeploy after env vars  
- [ ] Supabase redirect URLs include Vercel URL  
- [ ] Admin `role = 1` sa `users` table  

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 404 on whole site | Build Command = `npm run build`, Output = `public` |
| Login dili mo-work | Supabase redirect URLs + Confirm email OFF |
| Photos 404 on Vercel | Commit `images/` folder, push, redeploy |
| Admin upload fail | Run `images-schema-vercel.sql`, login as admin (`role = 1`) |

More detail: `VERCEL_SETUP.md`, `VERCEL_ENV_VARIABLES.md`, `IMAGES_SETUP.md`
