# Quick Start Guide - Supabase Integration

## ✅ What's Been Set Up

Your JJRK Studio application is now configured to use Supabase as the database! Here's what has been integrated:

### Files Created:
1. **supabase-config.js** - Supabase client configuration (needs your API key)
2. **db.js** - Database utility functions for all operations
3. **supabase-schema.sql** - Database schema to run in Supabase
4. **SUPABASE_SETUP.md** - Detailed setup instructions

### Files Updated:
1. **register.html** - Now uses Supabase authentication
2. **login.html** - Now uses Supabase authentication with admin check
3. **product.html** - Bookings saved to Supabase
4. **contact_us.html** - Messages saved to Supabase
5. **admin_dashboard.html** - Fetches all data from Supabase

## 🚀 Next Steps

### 1. Get Your Supabase API Key (REQUIRED)
   - Go to: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/settings/api
   - Copy the **anon/public** key
   - Open `supabase-config.js`
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual key

### 2. Create Database Tables
   - Go to: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new
   - Copy the entire contents of `supabase-schema.sql`
   - Paste and click **Run**
   - This creates: `users`, `bookings`, and `messages` tables

### 3. Create Admin Account
   - Register a new account using your registration form with email: `admin@jjrkstudio.com`
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
     ```
     **Note:** Role system uses numbers: `1` = Admin, `2` = User (default)

### 4. Run on Localhost (Chrome)
   ```bash
   npm start
   ```
   Open http://127.0.0.1:8080 in Chrome (do not open HTML files with `file://`).
   See **`LOCALHOST.md`** for Supabase redirect URL setup.

### 5. Test Your Application
   - Try registering a new user
   - Try logging in
   - Submit a booking from the products page
   - Submit a contact message
   - Log in as admin and check the dashboard

## 📋 Database Tables

### `users`
- Stores user profiles
- Linked to Supabase Auth
- Fields: id, email, full_name, phone, role, created_at, updated_at
- **Role values:** `1` = Admin, `2` = User (default)

### `bookings`
- Stores booking information
- Fields: id, service, client, email, phone, date, time, location, guests, status, created_at, updated_at
- Status values: 'pending', 'confirmed', 'cancelled'

### `messages`
- Stores contact form messages
- Fields: id, name, email, subject, message, read, created_at

## 🔒 Security

- Row Level Security (RLS) is enabled on all tables
- Users can only see their own profile
- Admins can see all bookings and messages
- Anyone can create bookings and messages (for public forms)

## ⚠️ Important Notes

1. **Never commit your API keys to public repositories**
2. The `anon/public` key is safe for frontend use
3. Keep your `service_role` key secret (never use in frontend)
4. Make sure to run the SQL schema before testing

## 🆘 Troubleshooting

- **"Invalid API key"** → Check that you've replaced the API key in `supabase-config.js`
- **"Table does not exist"** → Make sure you ran the SQL schema script
- **"Access denied"** → Verify your user has role = 1 (admin) in the database

For more details, see `SUPABASE_SETUP.md`

