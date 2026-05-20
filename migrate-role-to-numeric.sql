-- Migration Script: Convert Role from TEXT to INTEGER
-- Run this in Supabase SQL Editor if you have an existing database with text-based roles
-- This converts 'admin' to 1 and 'user' to 2

-- Step 1: Drop ALL policies that depend on role column FIRST
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

-- Step 2: Drop existing constraint and default
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Step 3: Change column type from TEXT to INTEGER with direct conversion
ALTER TABLE users 
ALTER COLUMN role TYPE INTEGER 
USING (
  CASE 
    WHEN role = 'admin' THEN 1
    WHEN role = 'user' THEN 2
    ELSE 2  -- Default to user if unknown value
  END
);

-- Step 4: Set new default value and CHECK constraint
ALTER TABLE users ALTER COLUMN role SET DEFAULT 2;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (1, 2));

-- Step 5: Recreate all RLS policies with numeric role check (role = 1 for admin)

-- Recreate policies with numeric role check (role = 1 for admin)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

CREATE POLICY "Admins can delete bookings" ON bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

CREATE POLICY "Admins can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

CREATE POLICY "Admins can update messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

CREATE POLICY "Admins can delete messages" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 1
    )
  );

-- Verification: Check if migration was successful
-- SELECT email, role FROM users;
-- Expected: role should be 1 (admin) or 2 (user)

