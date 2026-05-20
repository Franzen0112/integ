# Fix: "email rate limit exceeded" (decbucong@gmail.com / any user)

## What happened

Supabase blocked more signup emails (HTTP **429**). Your account is **already in the database** — registering again will not help.

## Fix in 2 minutes (Supabase Dashboard)

1. Open: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/auth/users  
2. Find **decbucong@gmail.com** (or your email)  
3. Click the user → **Confirm email** / mark as confirmed  
4. **Authentication** → **Providers** → **Email** → turn **OFF** "Confirm email" → **Save** (stops future rate limits during testing)

## Login rules (important)

- Use **full email** only — e.g. `decbucong@gmail.com`
- **Do not** use a username like `dromar` — login will fail
- Use **Login** page after the first successful register — do not keep clicking Sign Up

## Vercel (live site)

Add your Vercel URL in Supabase → **Authentication** → **URL Configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

## Then in the app

1. **Hard refresh**: `Ctrl + F5`  
2. **Login** (not Register): `/login.html`  
3. Email: `decbucong@gmail.com` (full email)  
4. Password: same password you used when registering

## Code change (already applied)

- Register now **tries login first** — existing accounts sign in without sending another signup email.  
- Signup only runs for **new** emails.  
- Rate limit / unconfirmed email shows a clear message and sends you to Login.

## Do not

- Click **Sign Up** again for the same email (triggers more 429 errors)  
- Wait ~1 hour if you need Supabase to send another verification email
