# Supabase Redirect URLs (Auth Callback)

Project: **eeagyngzbzcpqxptnqvy**  
Open: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/auth/url-configuration

---

## Site URL

Set **one** main URL (change when switching local vs production):

| Environment | Site URL |
|-------------|----------|
| Local | `http://127.0.0.1:8080` |
| Vercel (production) | `https://YOUR-APP.vercel.app` |

---

## Redirect URLs (copy all — one per line)

Replace `YOUR-APP.vercel.app` with your real Vercel domain.

```
http://127.0.0.1:8080/**
http://localhost:8080/**
http://127.0.0.1:8080/auth/callback.html
http://localhost:8080/auth/callback.html
https://YOUR-APP.vercel.app/**
https://YOUR-APP.vercel.app/auth/callback.html
https://YOUR-APP.vercel.app/login.html
```

Click **Save**.

---

## Auth callback sa app

After email confirmation or OAuth, Supabase sends the user to:

```
https://YOUR-APP.vercel.app/auth/callback.html
```

That page (`auth/callback.html`) reads the session and redirects to **dashboard** or **admin**.

Configured in code via `getAuthRedirectUrl()` in `supabase-config.js`.

---

## OAuth callback (optional note)

Supabase’s own OAuth callback (for Google/GitHub etc.) stays:

```
https://eeagyngzbzcpqxptnqvy.supabase.co/auth/v1/callback
```

That is **not** your Vercel URL — do not replace it. Your **Redirect URLs** list above is for where users land **after** auth on **your** site.

---

## Checklist

- [ ] Site URL = your live or local base URL  
- [ ] `/auth/callback.html` in Redirect URLs (local + Vercel)  
- [ ] `/**` wildcard for local and Vercel  
- [ ] Confirm email OFF **or** users confirmed in Authentication → Users  
