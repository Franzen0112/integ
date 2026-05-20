# Database Setup Guide - JJRK Studio

## ⚠️ IMPORTANT: Kailangan mo i-setup ang database bago mag-work ang registration!

Kung nakakita ka ug error sa registration, kasagaran kay **wala pa na-create ang database tables** sa Supabase.

## Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Adto sa: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new
2. O i-click ang **SQL Editor** sa left sidebar
3. I-click ang **New Query** button

### Step 2: Copy ug Paste ang SQL Schema

1. Open ang file: `supabase-schema.sql` sa imong project
2. **Copy ang TANAN** sulod sa file (Ctrl+A, then Ctrl+C)
3. I-paste sa Supabase SQL Editor (Ctrl+V)

### Step 3: Run ang SQL Script

1. I-click ang **Run** button (o press F5)
2. Wait hangtod ma-complete
3. Dapat makita mo ang message: "Success. No rows returned"

### Step 4: Verify nga Na-create ang Tables

1. Sa Supabase Dashboard, i-click ang **Table Editor** sa left sidebar
2. Dapat makita mo ang mosunod tables:
   - ✅ `users`
   - ✅ `bookings`
   - ✅ `messages`

### Step 5: Test ang Registration

1. Balik sa imong website: `https://final-itpe.vercel.app/register`
2. I-try mag-register ug bag-ong account
3. Dapat mag-work na!

## Common Errors ug Solutions

### Error: "relation 'users' does not exist"
**Solution**: Wala pa na-run ang SQL schema. I-follow ang Step 1-3 sa taas.

### Error: "duplicate key value violates unique constraint"
**Solution**: Ang email naa na sa database. I-try ug laing email.

### Error: "Database connection not ready"
**Solution**: 
1. I-refresh ang page
2. I-check ang browser console (F12) para sa errors
3. I-verify nga ang `supabase-config.js` na-load

### Error: "Supabase client not initialized"
**Solution**: 
1. I-check ang browser console (F12)
2. I-verify nga ang Supabase library na-load
3. I-check kung dunay CORS errors

## Quick Verification Checklist

- [ ] Na-run na ang `supabase-schema.sql` sa Supabase SQL Editor?
- [ ] Na-verify na nga naa ang `users`, `bookings`, ug `messages` tables?
- [ ] Naka-open na ang browser console (F12) para sa errors?
- [ ] Na-try na mag-register ug bag-ong account?

## After Setup

Pagkatapos ma-setup ang database:

1. **Create Admin Account**:
   - I-register ang account gamit ang email: `admin@jjrkstudio.com`
   - Sa Supabase SQL Editor, i-run:
     ```sql
     UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
     ```
     **Note:** Role system uses numbers: `1` = Admin, `2` = User (default)

2. **Test All Features**:
   - ✅ Registration
   - ✅ Login
   - ✅ Booking submission
   - ✅ Contact form
   - ✅ Admin dashboard

## Need Help?

Kung dunay errors gihapon:
1. I-open ang browser console (F12)
2. I-check ang **Console** tab para sa error messages
3. I-check ang **Network** tab para sa failed requests
4. I-copy ang error messages ug i-share para sa troubleshooting

