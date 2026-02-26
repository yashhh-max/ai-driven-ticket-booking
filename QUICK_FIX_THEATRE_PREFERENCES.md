# Quick Fix: Theatre Preferences "Delete error: {}" 

## The Problem
You're seeing "Delete error: {}" when trying to save theatre preferences. This means the database is blocking delete operations due to missing Row Level Security (RLS) policies.

## The Solution (3 Steps - 5 minutes)

### Step 1: Verify Table Exists ⏱️ 1 minute

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste and run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_theatre_preferences';
```

**Expected Result:**
```
table_name
user_theatre_preferences
```

**If you see no results:**
- Copy entire contents of `scripts/017_add_theatre_preferences_table.sql`
- Paste into new SQL query
- Click Run
- Come back to Step 2

---

### Step 2: Run RLS Setup Script ⏱️ 2 minutes

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy the entire file contents:
📄 `scripts/018_setup_rls_theatre_preferences.sql`

Paste into SQL Editor and click **Run**.

**Expected Output:**
- See table columns listed (id, user_id, theatre_id, priority, etc.)
- See 4 policy rows created:
  - "Users can read their own theatre preferences"
  - "Users can insert their own theatre preferences"
  - "Users can update their own theatre preferences"
  - "Users can delete their own theatre preferences"

**If you see errors:**
- Scroll down to "Debugging" section below

---

### Step 3: Test in Your App ⏱️ 2 minutes

1. Go to your app → **Login** (if not already)
2. Visit: `http://localhost:3000/auto-book/preferences`
3. Select 3 theatres
4. Click **Save**
5. **Open Browser DevTools** (Press F12)
6. Go to **Console** tab
7. Look for these messages:

**✅ Success:**
```
Starting preference save for user: {some-uuid}
Table access OK, existing preferences: [...]
Delete response: {status: 204, data: null, error: null}
Preferences to insert: [...]
Insert response: {status: 201, ...}
```
→ Should show success toast and redirect to `/auto-book`

**❌ Still Error:**
```
Delete error: {}
```
→ Go to "Debugging" section below

---

## Debugging: If Still Not Working

### Check 1: Verify RLS Policies Were Created

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste and run:
```sql
SELECT policy_name, cmd FROM pg_policies 
WHERE tablename = 'user_theatre_preferences'
ORDER BY policy_name;
```

**Expected: 4 rows**
- cmd should be: SELECT, INSERT, UPDATE, DELETE

**If you see 0-3 rows:**
- Run Step 2 again (maybe it failed silently)
- Or check Supabase Logs for errors

### Check 2: Verify Current User Can Access

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Run as the user you're logged in as. Paste and run:
```sql
-- Check if your user can read/write
SELECT * FROM user_theatre_preferences 
WHERE user_id = auth.uid() 
LIMIT 1;
```

**Expected:**
- Returns empty result (no data yet) - this is OKAY
- Does NOT say "permission denied" - this is GOOD

**If error says "permission denied":**
- RLS policies not created properly
- Run Step 2 again carefully
- Check that RLS script ran without errors

### Check 3: Test Table Access Directly

Still in SQL Editor, run:
```sql
-- Insert test preference
INSERT INTO user_theatre_preferences (user_id, theatre_id, priority)
VALUES (auth.uid(), (SELECT id FROM theaters LIMIT 1), 1);

-- Delete test preference
DELETE FROM user_theatre_preferences 
WHERE user_id = auth.uid();

-- Count final preferences
SELECT COUNT(*) FROM user_theatre_preferences 
WHERE user_id = auth.uid();
```

**Expected:**
- Insert succeeds (shows 1 row)
- Delete succeeds 
- Count shows 0

**If these fail:**
- Stop and review RLS setup
- Compare your policies to the reference at end of this document

---

## Diagnostic Help

Run this to auto-diagnose everything:

**In Supabase** → **SQL Editor** → **New Query** → Copy & Run:

```sql
-- QUICK DIAGNOSTICS
SELECT 'TABLE' as check, CASE 
  WHEN EXISTS(SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_theatre_preferences') 
  THEN '✅ Exists' ELSE '❌ Missing' END as status
UNION ALL
SELECT 'RLS', CASE 
  WHEN EXISTS(SELECT 1 FROM pg_tables 
    WHERE schemaname='public' AND tablename='user_theatre_preferences' AND rowsecurity=true) 
  THEN '✅ Enabled' ELSE '❌ Disabled' END
UNION ALL
SELECT 'POLICIES', (SELECT COUNT(*) || '/4' FROM pg_policies 
  WHERE tablename='user_theatre_preferences');
```

Or use the full diagnostic script:
📄 `scripts/000_diagnose_preferences_setup.sql`

---

## Reference: Expected RLS Policy SQL

If you need to manually create policies, here's what should exist:

```sql
-- Policy 1: Read
CREATE POLICY "Users can read their own theatre preferences"
ON user_theatre_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Insert
CREATE POLICY "Users can insert their own theatre preferences"
ON user_theatre_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Update
CREATE POLICY "Users can update their own theatre preferences"
ON user_theatre_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Delete
CREATE POLICY "Users can delete their own theatre preferences"
ON user_theatre_preferences FOR DELETE
USING (auth.uid() = user_id);
```

All 4 policies MUST exist for full functionality.

---

## After Fix: Verification Checklist

- [ ] Ran script 018 in Supabase
- [ ] Verified 4 policies exist with `pg_policies` query
- [ ] Console shows no "Delete error" messages
- [ ] Theatre preferences page saves without error
- [ ] Can see selected theatres on `/auto-book` page
- [ ] Preferences persist after page refresh
- [ ] Toast shows "Your theatre preferences have been updated"

---

## Still Stuck?

1. **Screenshot browser console** showing the exact error
2. **Check Supabase Dashboard** → **Logs** tab for auth/permission errors
3. **Verify you're logged in** (not as anonymous user)
4. **Run diagnostic script** (`000_diagnose_preferences_setup.sql`) and share output
5. **Share these details:**
   - Error message from console
   - Output from scripts/017 when first run
   - Output from scripts/018 when run
   - Result of `pg_policies` query

---

## What This Fix Does

The RLS setup script (018) creates security policies that tell Supabase:
- ✅ Users can read THEIR OWN theatre preferences
- ✅ Users can create THEIR OWN theatre preferences
- ✅ Users can change THEIR OWN theatre preferences
- ✅ Users can delete THEIR OWN theatre preferences
- ❌ Users CANNOT see/change other users' preferences

Without these policies, Supabase blocks all access for security reasons.

---

**Next: Once theatre preferences save successfully, the auto-booking system will use them to prioritize which theatres to try first!**
