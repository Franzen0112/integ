-- Fix RLS Policies for Users Table
-- This fixes the 500 error when checking admin status
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Step 2: Create a function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role INTEGER;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role = 1, false);
END;
$$;

-- Step 3: Create policies (order matters!)
-- Policy 1: Users can ALWAYS read their own profile (including role)
-- This MUST work without any admin checks to avoid circular dependency
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can view all users
-- Uses the function to avoid circular dependency
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT 
  USING (
    public.is_user_admin(auth.uid())
  );

-- Step 4: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

