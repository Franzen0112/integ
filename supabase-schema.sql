-- Supabase Database Schema for JJRK Studio
-- Run this SQL in your Supabase SQL Editor to create the necessary tables
--
-- ⚠️ IMPORTANT: 
-- - If you have an EXISTING database with TEXT roles, run migrate-role-to-numeric.sql FIRST
-- - If this is a NEW database, you can run this schema directly
-- - This script will DROP existing tables if they exist (data will be lost!)

-- ===== USERS TABLE =====
-- This table stores user profiles
-- Drop table if exists to ensure clean setup (WARNING: This will delete all user data!)
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role INTEGER DEFAULT 2 CHECK (role IN (1, 2)), -- 1 = Admin, 2 = User
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Policy: Users can read their own profile (including role)
-- This MUST work without checking admin status to avoid circular dependency
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Admins can view all users
-- Uses alias 'u' to avoid circular dependency issues
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 1
    )
  );

-- ===== BOOKINGS TABLE =====
-- This table stores booking information
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  client TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  guests TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Policy: Anyone can create bookings
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read bookings (or restrict to own bookings if needed)
CREATE POLICY "Anyone can view bookings" ON bookings
  FOR SELECT USING (true);

-- Policy: Only admins can update bookings
CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- Policy: Only admins can delete bookings
CREATE POLICY "Admins can delete bookings" ON bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- ===== MESSAGES TABLE =====
-- This table stores contact form messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Admins can view messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

-- Policy: Anyone can create messages
CREATE POLICY "Anyone can create messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Policy: Only admins can read messages
CREATE POLICY "Admins can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- Policy: Only admins can update messages
CREATE POLICY "Admins can update messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- Policy: Only admins can delete messages
CREATE POLICY "Admins can delete messages" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- ===== CREATE ADMIN USER FUNCTION =====
-- Function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    2  -- Default role: 2 = User
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== CREATE ADMIN USER (Optional) =====
-- After creating your admin account through the app, run this to set admin role:
-- UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
-- Note: role = 1 (Admin), role = 2 (User)

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

