# Theatre Preferences Setup & Troubleshooting Guide

## Overview
The theatre preferences feature requires database setup and proper Row Level Security (RLS) policies to function correctly. If you're experiencing "Delete error: {}" or save failures, follow this guide.

---

## Step 1: Run the RLS Setup Script (CRITICAL)

Your theatre preferences table needs Row Level Security policies to allow users to access their own data.

### Instructions:
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents from: `scripts/018_setup_rls_theatre_preferences.sql`
5. Paste it into the SQL Editor
6. Click **Run** button
7. Check for success message (should show table structure and policies created)

### What this script does:
- Grants permissions to authenticated and anonymous users
- Enables RLS on the `user_theatre_preferences` table
- Creates 4 RLS policies:
  - Read own preferences
  - Insert own preferences
  - Update own preferences  
  - Delete own preferences
- Verifies policies are created

### Expected Output:
```
table_name            | column_name    | data_type | ...
user_theatre_preferences | id          | uuid      | ...
user_theatre_preferences | user_id     | uuid      | ...
user_theatre_preferences | theatre_id  | uuid      | ...
user_theatre_preferences | priority    | smallint  | ...

policy_name                              | qual                      | with_check
Users can read their own theatre preferences      | (auth.uid() = user_id)  | 
Users can insert their own theatre preferences    |                         | (auth.uid() = user_id)
Users can update their own theatre preferences    | (auth.uid() = user_id)  | (auth.uid() = user_id)
Users can delete their own theatre preferences    | (auth.uid() = user_id)  |
```

---

## Step 2: Verify Table Exists

If you get an error "Table does not exist", run this script first: `scripts/017_add_theatre_preferences_table.sql`

### Check table existence:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_theatre_preferences';
```

Should return:
```
table_name
user_theatre_preferences
```

---

## Step 3: Test RLS Policies

After running the setup script, verify policies are active:

```sql
SELECT policy_name, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_theatre_preferences'
ORDER BY policy_name;
```

Should return 4 rows with policies.

---

## Step 4: Troubleshoot Save Errors

### Error: "Delete error: {}" (Empty object)

**Root Cause:** RLS policies are blocking the delete operation

**Solution:**
1. Verify you ran Step 1 (018 script)
2. Check browser console for detailed logs:
   - Open DevTools (F12)
   - Go to Console tab
   - Try saving theatre preferences again
   - Look for messages like:
     - ✅ "Table access OK" → RLS is allowing reads
     - ✅ "Delete response: {...}" → Shows what happened
     - ❌ "Delete error details: {...}" → Shows why it failed

3. If you see empty error object `{}`:
   - RLS policies might not be created
   - Verify Step 1 output shows 4 policies
   - Try running 018 script again

### Error: "Cannot access preferences table"

**Root Cause:** Basic table access check failed (severe RLS issue)

**Solution:**
1. Verify table exists: `SELECT * FROM user_theatre_preferences LIMIT 1;`
2. Run full 018 setup again
3. Check Supabase auth - ensure user is logged in with email verified

### Error: "Failed to save preferences" (After insert)

**Root Cause:** Column name mismatch or data validation

**Solution:**
1. Verify table structure matches code:
   ```sql
   \d user_theatre_preferences
   ```
   
   Should have columns:
   - id (uuid, primary key)
   - user_id (uuid)
   - theatre_id (uuid)
   - priority (smallint, integer)

2. Check constraints:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name = 'user_theatre_preferences';
   ```

---

## Step 5: Test Full Flow

After setup:

1. **Login** to your app
2. Go to: `/auto-book/preferences`
3. Select 3 theatres
4. Reorder priorities
5. Click **Save**
6. Check browser console for:
   ```
   Starting preference save for user: {uuid}
   Table access OK, existing preferences: [...]
   Delete response: {status: 204, data: null, error: null}
   Preferences to insert: [...]
   Insert response: {status: 201, data: [...], error: null}
   ```

7. Should redirect to `/auto-book` and show success toast

---

## Step 6: Verify Persistence

After successful save:

1. Go to `/auto-book` page
2. Look for **"Your Theatre Preferences"** section
3. Should display 3 selected theatres with priority badges (🥇 🥈 🥉)
4. Refresh page - preferences should still show (confirming persistence)

---

## Debugging Checklist

- [ ] Ran `scripts/018_setup_rls_theatre_preferences.sql` in Supabase
- [ ] Verified 4 RLS policies exist in pg_policies
- [ ] Confirmed `user_theatre_preferences` table exists
- [ ] Logged in as authenticated user (not anonymous)
- [ ] Browser DevTools console shows detailed logs (not empty errors)
- [ ] Delete operation returns HTTP 204 status
- [ ] Insert operation returns HTTP 201 status
- [ ] Preferences appear on `/auto-book` page after save
- [ ] Preferences persist after page refresh

---

## Quick Reference Commands

Copy these into Supabase SQL Editor to verify setup:

```sql
-- Check table exists
SELECT * FROM user_theatre_preferences LIMIT 1;

-- Count your saved preferences
SELECT COUNT(*) FROM user_theatre_preferences WHERE user_id = auth.uid();

-- View your preferences
SELECT * FROM user_theatre_preferences 
JOIN theaters ON user_theatre_preferences.theatre_id = theaters.id
WHERE user_id = auth.uid()
ORDER BY priority;

-- Check RLS is enabled
SELECT tablename FROM pg_tables WHERE schemaname='public' 
AND rowsecurity = true AND tablename='user_theatre_preferences';

-- View all RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_theatre_preferences';

-- Delete all your preferences (manual cleanup)
DELETE FROM user_theatre_preferences WHERE user_id = auth.uid();
```

---

## Common Questions

**Q: Do I need to restart my Next.js server?**
A: No, RLS policies take effect immediately in Supabase database. No app restart needed.

**Q: Can I test without being logged in?**
A: No, RLS policies check `auth.uid()`. You must be authenticated. Test with a real user account.

**Q: How many theatres can I select?**
A: Maximum 3 theatres. The UI prevents selecting more than 3.

**Q: Do preferences affect actual bookings?**
A: Yes, when using auto-booking. The system tries to book at your preferred theatres in priority order before falling back to others.

**Q: Can I change preferences later?**
A: Yes, go back to `/auto-book/preferences` and update anytime. Old preferences are deleted when you save new ones.

---

## Still Having Issues?

1. **Check the complete error object:**
   - In browser DevTools, find the console line with full error
   - Screenshot or copy the exact error message
   - It will contain HTTP status code and response body

2. **Review Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for failed authentication or permission denied errors
   - Filter by timestamp of your test

3. **Verify user ID consistency:**
   - Run: `SELECT auth.uid();` in SQL Editor
   - This shows current logged-in user
   - Verify this matches your test user account

4. **Test basic query:**
   - Run: `SELECT * FROM theaters;` → Should show theatres
   - Run: `SELECT * FROM user_theatre_preferences;` → Should show (potentially empty)
   - Should NOT get "permission denied" errors

---

## Next Steps After Setup

Once theatre preferences are saving correctly:

1. **Build auto-booking logic** to use preferences
2. **Test end-to-end flow**: Select preferences → Trigger auto-booking → Verify books at preferred theatre first
3. **Monitor production**: Check logs for any booking failures

See [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) for complete auto-booking integration.
