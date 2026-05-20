# Supabase Setup Instructions for JJRK Studio

This guide will help you set up Supabase for your JJRK Studio application.

## Step 1: Get Your Supabase API Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy
2. Navigate to **Settings** → **API**
3. Copy your **anon/public** key (this is safe to use in frontend code)
4. Open `supabase-config.js` and replace `YOUR_SUPABASE_ANON_KEY` with your actual key

## Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to execute the SQL script
5. This will create:
   - `users` table (for user profiles)
   - `bookings` table (for booking records)
   - `messages` table (for contact form messages)
   - Row Level Security (RLS) policies
   - Triggers and functions

## Step 3: Create an Admin User

After setting up the database:

1. Use the registration form in your app to create an account with email: `admin@jjrkstudio.com`
2. In Supabase SQL Editor, run this query to make the user an admin:
   ```sql
   UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
   ```
   **Note:** Role system uses numbers: `1` = Admin, `2` = User (default)

## Step 4: Include Supabase in Your HTML Files

Make sure all your HTML files that need database access include these scripts in the `<head>` or before `</body>`:

```html
<!-- Supabase JS Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Configuration -->
<script src="supabase-config.js"></script>

<!-- Database Utility Functions -->
<script src="db.js"></script>
```

## Step 5: Run on Localhost (Chrome)

See **`LOCALHOST.md`** for full steps. Quick version:

```bash
npm start
```

Open http://127.0.0.1:8080/login.html in Chrome.

Add these URLs in Supabase → **Authentication** → **URL Configuration** (full list: **`SUPABASE_REDIRECT_URLS.md`**):
- Site URL: `http://127.0.0.1:8080` (local) or your Vercel URL (production)
- Redirect URLs must include **`/auth/callback.html`** (auth callback after email confirm)

The same Supabase accounts work on localhost and production.

## Step 6: Test the Setup

1. Try registering a new user
2. Try logging in
3. Submit a booking from the products page
4. Submit a contact message
5. Log in as admin and check the admin dashboard

## Database Tables Overview

### `users` Table
- Stores user profiles linked to Supabase Auth
- Fields: `id`, `email`, `full_name`, `phone`, `role`, `created_at`, `updated_at`
- **Role values:** `1` = Admin, `2` = User (default)

### `bookings` Table
- Stores booking information
- Fields: `id`, `service`, `client`, `email`, `phone`, `date`, `time`, `location`, `guests`, `status`, `created_at`, `updated_at`

### `messages` Table
- Stores contact form messages
- Fields: `id`, `name`, `email`, `subject`, `message`, `read`, `created_at`

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only see their own profile
- Admins can see all bookings and messages
- Anyone can create bookings and messages (for the contact form)
- Make sure to keep your `service_role` key secret (never use it in frontend code)

## Troubleshooting

### "Invalid API key" error
- Make sure you copied the correct `anon/public` key from Supabase Settings → API
- Ensure the key is properly set in `supabase-config.js`

### "Table does not exist" error
- Make sure you ran the SQL schema script in Supabase SQL Editor
- Check that all tables were created successfully

### Authentication not working
- Verify that Supabase Auth is enabled in your project
- Check the browser console for detailed error messages

### User is in database but cannot login
This usually means the account exists in the `users` table but Supabase Auth still requires email confirmation.

**Option A (recommended for development):** Disable email confirmation
1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save, then register a new test user OR manually confirm existing users (Option B)

**Option B:** Confirm existing users manually
1. Supabase Dashboard → **Authentication** → **Users**
2. Open the user → click **Confirm email** (or set email as confirmed)

**Option C:** User verifies via email
- After register, check inbox/spam for the confirmation link
- On login page, if you see "email not confirmed", use the resend prompt

Also run `fix-rls-policies.sql` in the SQL Editor if admin login redirects fail after a successful login.

## Need Help?

Refer to the Supabase documentation: https://supabase.com/docs

