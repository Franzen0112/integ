# Debug Guide - Registration Not Working

Kung ang registration dili gihapon mag-work, i-follow ang mosunod steps para ma-identify ang problema:

## Step 1: I-check ang Browser Console

1. I-open ang registration page: `https://final-itpe.vercel.app/register`
2. I-press **F12** para ma-open ang Developer Tools
3. I-click ang **Console** tab
4. I-refresh ang page (F5)
5. Tan-awa kung dunay errors

### Dapat makita mo:
- ✅ `Setting up form handler...`
- ✅ `window.supabase: object`
- ✅ `window.supabaseClient: [object Object]`
- ✅ `window.db: object`
- ✅ `All scripts loaded successfully`

### Kung makakita ka ug errors:
- ❌ `Supabase library not loaded` → Ang CDN dili ma-load
- ❌ `Supabase client not initialized` → Ang supabase-config.js dili ma-load
- ❌ `Database functions not loaded` → Ang db.js dili ma-load
- ❌ `relation 'users' does not exist` → **Wala pa na-run ang SQL schema!**

## Step 2: I-check ang Network Tab

1. Sa Developer Tools, i-click ang **Network** tab
2. I-refresh ang page
3. Tan-awa kung dunay failed requests (red color)

### Dapat ma-load ang mosunod:
- ✅ `@supabase/supabase-js@2` (status: 200)
- ✅ `supabase-config.js` (status: 200)
- ✅ `db.js` (status: 200)

### Kung dunay failed requests:
- I-check ang error message
- I-verify nga ang files na-deploy sa Vercel

## Step 3: I-verify ang Database Setup

**IMPORTANTE**: Dili mag-work ang registration kung wala pa na-create ang database tables!

1. Adto sa: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new
2. I-run ang mosunod query para ma-check kung naa ang tables:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'bookings', 'messages');
   ```
3. Dapat makita mo ang 3 tables: `users`, `bookings`, `messages`

### Kung wala ang tables:
1. I-open ang `supabase-schema.sql` file
2. I-copy ang TANAN content
3. I-paste sa Supabase SQL Editor
4. I-click **Run**
5. I-verify nga successful ang execution

## Step 4: I-test ang Supabase Connection

Sa browser console, i-type ang mosunod:

```javascript
// Check if Supabase is loaded
console.log('Supabase:', window.supabase);
console.log('Supabase Client:', window.supabaseClient);

// Test connection
if (window.supabaseClient) {
  window.supabaseClient.from('users').select('count').then(result => {
    console.log('Database connection test:', result);
  });
}
```

### Expected Results:
- ✅ `Supabase:` should show an object
- ✅ `Supabase Client:` should show an object
- ✅ `Database connection test:` should show `{data: [...], error: null}`

### Kung dunay errors:
- I-check ang error message
- I-verify nga ang API key tama sa `supabase-config.js`

## Step 5: I-check ang Actual Error sa Registration

1. I-try mag-register
2. I-check ang console para sa error messages
3. I-copy ang error message

### Common Errors:

#### Error: "relation 'users' does not exist"
**Solution**: Wala pa na-run ang SQL schema. I-follow ang Step 3.

#### Error: "duplicate key value violates unique constraint"
**Solution**: Ang email naa na sa database. I-try ug laing email.

#### Error: "Supabase client not initialized"
**Solution**: 
- I-refresh ang page
- I-check kung dunay CORS errors
- I-verify nga ang internet connection stable

#### Error: "Failed to fetch" or Network Error
**Solution**: 
- I-check ang internet connection
- I-check kung dunay CORS errors sa Network tab
- I-verify nga ang Supabase URL tama

## Step 6: I-verify ang File Paths

I-check kung ang tanan files na-deploy:

1. Sa Vercel Dashboard, i-check ang **Deployments** tab
2. I-click ang latest deployment
3. I-check ang **Build Logs**
4. I-verify nga walay errors

O i-check direkta sa browser:
- `https://final-itpe.vercel.app/supabase-config.js` → Dapat makita ang JavaScript code
- `https://final-itpe.vercel.app/db.js` → Dapat makita ang JavaScript code

## Quick Fix Checklist

- [ ] Na-run na ang SQL schema sa Supabase?
- [ ] Na-verify na nga naa ang `users` table?
- [ ] Naka-open na ang browser console (F12)?
- [ ] Walay errors sa console?
- [ ] Ang tanan scripts na-load (check Network tab)?
- [ ] Na-try na i-refresh ang page?
- [ ] Na-check na ang actual error message?

## Still Not Working?

Kung dunay specific error message, i-copy ug i-share para ma-troubleshoot nato.

Common issues:
1. **Database tables wala pa na-create** → I-run ang SQL schema
2. **Scripts dili ma-load** → I-check ang file paths sa Vercel
3. **CORS errors** → I-check ang Supabase settings
4. **API key sayop** → I-verify ang API key sa supabase-config.js

