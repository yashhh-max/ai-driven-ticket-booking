# 🎬 Theatre Preferences - READ THIS FIRST

## Your Issue: "Delete error: {}"

You're trying to save theatre preferences but getting an empty error object in the console. **This is fixable in ~6 minutes.**

---

## What's Happening (In Simple Terms)

### The Flow:
1. You select 3 theatres ✅
2. Click Save ✅
3. Browser sends data to database ✅
4. **Supabase says: "Who are you? Do you have permission to delete?"** ❓
5. **You reply: "It's me! User 123!"** 
6. **Supabase checks: "Do I have a rule saying user 123 can do this?"** 🔍
7. **Finds: "No rule exists"** ❌
8. **Returns empty error: `{}`** to browser
9. You see: "Delete error: {}" 😞

### The Root Cause:
Your database is **missing security rules** (called RLS policies) that tell Supabase: *"Yes, this user is allowed to save their own preferences."*

---

## The Fix (3 Commands, ~6 Minutes)

### What You Need:
- Access to your **Supabase Dashboard**
- Your browser
- That's it!

### Step 1: Prepare (1 min)
Open your Supabase dashboard and go to **SQL Editor**.

### Step 2: Create Security Rules - THE FIX (2 min)
1. Click **New Query**
2. Open this file in your code editor: `scripts/018_setup_rls_theatre_preferences.sql`
3. Copy the **entire** file contents (Ctrl+A, Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click the green **Run** button

**That's it!** The script creates the missing security rules.

### Step 3: Verify (1 min)
1. Open this file: `scripts/000_diagnose_preferences_setup.sql`
2. Copy entire contents
3. Paste into **new** SQL query in Supabase
4. Click **Run**
5. Look for this message: **"✅ ALL CHECKS PASSED"**

### Step 4: Test (2 min)
1. Go to your app: `http://localhost:3000/auto-book/preferences`
2. Select 3 theatres
3. Click **Save**
4. Should see: **"Your theatre preferences have been updated"** ✅
5. Should see preferences on the `/auto-book` page ✅

---

## Problem? Check These

### "Still getting Delete error after running script 018"
- Did you see "4 policies created" output after running the SQL?
- If NO: Run script 018 again - it might have failed silently
- If YES: Check browser console for different error message

### "Script 018 gave me an error"
- Copy the exact error message
- Run diagnostic script 000 to see what's missing
- Check: [THEATRE_PREFERENCES_SETUP.md](THEATRE_PREFERENCES_SETUP.md) → Troubleshooting

### "Preferences saved but don't show on /auto-book"
- Refresh the page
- If still missing: Check browser DevTools Network tab
- Should see API response with preferences data

---

## If All Else Fails

1. Run diagnostic: `scripts/000_diagnose_preferences_setup.sql`
2. Read: [THEATRE_PREFERENCES_SETUP.md](THEATRE_PREFERENCES_SETUP.md) - Troubleshooting section
3. Cross-reference your issue with the "Problem Scenarios" in that file

---

## After It's Fixed

### What You Get:
✅ Theatre preferences save without errors
✅ Preferences display on `/auto-book` page
✅ Can modify preferences anytime
✅ Auto-booking will use these preferences

### Optional: Integrate with Auto-Booking
When you're ready, auto-booking can use these preferences to try your preferred theatres first. See: [INTEGRATE_PREFERENCES_GUIDE.md](INTEGRATE_PREFERENCES_GUIDE.md)

---

## Documentation Map

| Need | File | Time |
|------|------|------|
| **Quick fix** | [QUICK_FIX_THEATRE_PREFERENCES.md](QUICK_FIX_THEATRE_PREFERENCES.md) | 5 min |
| **Full details** | [THEATRE_PREFERENCES_SETUP.md](THEATRE_PREFERENCES_SETUP.md) | 20 min |
| **Context** | [THEATRE_PREFERENCES_STATUS.md](THEATRE_PREFERENCES_STATUS.md) | 10 min |
| **Visual guide** | [THEATRE_PREFERENCES_VISUAL_GUIDE.md](THEATRE_PREFERENCES_VISUAL_GUIDE.md) | 8 min |
| **Integration** | [INTEGRATE_PREFERENCES_GUIDE.md](INTEGRATE_PREFERENCES_GUIDE.md) | 15 min |
| **Navigation** | [PREFERENCES_SYSTEM_INDEX.md](PREFERENCES_SYSTEM_INDEX.md) | 5 min |

---

## Scripts Location

```
scripts/
├── 017_add_theatre_preferences_table.sql
│   └─ Creates database table (only if table missing)
│
├── 018_setup_rls_theatre_preferences.sql ⭐
│   └─ Creates security rules (REQUIRED - Run this now!)
│
└── 000_diagnose_preferences_setup.sql
    └─ Checks everything is working (verify after step 2)
```

---

## Success Checklist

After fix:
- [ ] No "Delete error" in console ✅
- [ ] Saw success toast when saving ✅
- [ ] Can see preferences on `/auto-book` ✅
- [ ] Preferences still show after page refresh ✅
- [ ] Diagnostic script shows "✅ ALL CHECKS PASSED" ✅

---

## In 30 Seconds

**Problem:** Can't save theatre preferences (Delete error: {})  
**Cause:** Missing database security rules (RLS policies)  
**Solution:** Run `scripts/018_setup_rls_theatre_preferences.sql` in Supabase  
**Time:** 6 minutes total  
**Result:** Preferences save and display correctly  

---

## Next Steps

### Immediate (Do Now):
1. → Open Supabase SQL Editor
2. → Run script 018
3. → Test save in app
4. → See preferences display

### When Ready (Optional):
1. → Read integration guide
2. → Update auto-booking to use preferences
3. → Test full booking flow

---

**Your Issue:** Theatre preferences not saving  
**Your Solution:** Run RLS setup script (script 018)  
**Your Time:** ~6 minutes  
**Your Result:** Fully working preferences system  

### 👉 **Next: Go to Supabase and run script 018 in SQL Editor**

---

## Ultra-Quick Command Reference

If you already know what to do:

**In Supabase SQL Editor:**
```bash
# 1. Create policies
[Copy scripts/018_setup_rls_theatre_preferences.sql]
[Paste and Run]

# 2. Verify
[Copy scripts/000_diagnose_preferences_setup.sql]
[Paste and Run]
[Look for ✅ ALL CHECKS PASSED]
```

**In your app:**
```bash
# 3. Test
Visit: http://localhost:3000/auto-boot/preferences
Select 3 theatres
Click Save
```

**Expected:** Success toast, no errors ✅

---

## Help Resources

- 📖 [Full Setup Guide](THEATRE_PREFERENCES_SETUP.md) - Complete reference
- 🆘 [Troubleshooting](THEATRE_PREFERENCES_SETUP.md#step-4-troubleshoot-save-errors) - Common issues
- 🔗 [Integration Guide](INTEGRATE_PREFERENCES_GUIDE.md) - Connect to auto-booking
- 📋 [Status Document](THEATRE_PREFERENCES_STATUS.md) - Complete explanation
- 📊 [Visual Guide](THEATRE_PREFERENCES_VISUAL_GUIDE.md) - Diagrams and flows
- 📑 [Index](PREFERENCES_SYSTEM_INDEX.md) - Navigation hub

---

**Last Updated:** December 2024  
**Status:** ✅ Ready to Fix  
**Issue Type:** Missing RLS Policies  
**Severity:** High Priority (blocks all preferences)  
**Fix Difficulty:** Simple (1 SQL script)  
**Time to Resolve:** ~6 minutes  

---

## TL;DR

```
PROBLEM:    Delete error: {} when saving theatre preferences
REASON:     Missing RLS security policies in database
SOLUTION:   Run scripts/018_setup_rls_theatre_preferences.sql
WHERE:      Supabase Dashboard → SQL Editor → New Query
HOW LONG:   6 minutes
WHAT AFTER: Theatre preferences work perfectly ✅
```

---

🚀 **Ready to fix this? Open Supabase SQL Editor and run script 018 now!**
