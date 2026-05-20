# Role System Update: Numeric Roles

## Overview

The role system has been updated from text-based (`'admin'`, `'user'`) to numeric values:
- **1 = Admin**
- **2 = User** (default)

## What Changed

### 1. Database Schema (`supabase-schema.sql`)
- Changed `role` column from `TEXT` to `INTEGER`
- Updated default value from `'user'` to `2`
- Updated CHECK constraint from `('user', 'admin')` to `(1, 2)`
- Updated all RLS policies to check for `role = 1` instead of `role = 'admin'`

### 2. Code Files (`db.js`)
- Updated `isAdmin()` function to check for `role === 1` instead of `role === 'admin'`

### 3. Documentation
- Updated all documentation files to reflect numeric role system
- Created migration script for existing databases

## For New Databases

If you're setting up a fresh database:
1. Run `supabase-schema.sql` in Supabase SQL Editor
2. Register a user account
3. Set admin role with:
   ```sql
   UPDATE users SET role = 1 WHERE email = 'admin@jjrkstudio.com';
   ```

## For Existing Databases

If you already have a database with text-based roles, you need to migrate:

### Migration Steps:

1. **Run the migration script** in Supabase SQL Editor:
   - Open `migrate-role-to-numeric.sql`
   - Copy the entire contents
   - Paste in Supabase SQL Editor
   - Click **Run**

2. **Verify the migration**:
   ```sql
   SELECT email, role FROM users;
   ```
   - All roles should now be `1` (admin) or `2` (user)

3. **Update existing admin users** (if needed):
   ```sql
   -- If you had 'admin' users, they should already be converted to 1
   -- But you can verify with:
   SELECT email, role FROM users WHERE role = 1;
   ```

## Setting Admin Role

To make a user an admin:
```sql
UPDATE users SET role = 1 WHERE email = 'user@example.com';
```

To check a user's role:
```sql
SELECT email, role FROM users WHERE email = 'user@example.com';
```

## Benefits of Numeric Roles

1. **Performance**: Integer comparisons are faster than string comparisons
2. **Storage**: Integers use less storage space
3. **Consistency**: Easier to validate and maintain
4. **Scalability**: Easy to add more roles in the future (3, 4, etc.)

## Troubleshooting

### "Access denied" after migration
- Verify the user has `role = 1` in the database
- Check browser console for errors
- Make sure you ran the migration script completely

### Migration failed
- Check if you have existing data in the `users` table
- Make sure all existing roles are either `'admin'` or `'user'`
- Try running the migration steps individually if needed

## Files Modified

- ✅ `db.js` - Updated `isAdmin()` function
- ✅ `supabase-schema.sql` - Updated schema for new databases
- ✅ `migrate-role-to-numeric.sql` - Migration script for existing databases
- ✅ `SUPABASE_SETUP.md` - Updated documentation
- ✅ `QUICK_START.md` - Updated documentation
- ✅ `DATABASE_SETUP_GUIDE.md` - Updated documentation

