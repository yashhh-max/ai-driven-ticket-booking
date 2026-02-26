# Theatre Preferences System - Visual & Reference Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THEATRE PREFERENCES SYSTEM                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐    ┌──────────────────────────┐     │
│  │  /auto-book page         │    │  /auto-book/preferences  │     │
│  ├──────────────────────────┤    ├──────────────────────────┤     │
│  │ • Display saved prefs    │    │ • Select theatres        │     │
│  │ • Show 3 priorities      │    │ • Drag to reorder        │     │
│  │ • 🥇 🥈 🥉 badges       │    │ • Set priority order     │     │
│  │                          │    │ • Save/Cancel buttons    │     │
│  └──────────────────────────┘    └──────────────────────────┘     │
│             ↑                               ↓                      │
│             └───────────────┬───────────────┘                      │
│                             │ API Calls                            │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINT                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POST /api/auto-book/preferences                                   │
│  • Receive theatre selections from UI                              │
│  • Extract user from auth token                                    │
│  • Delete old preferences                                          │
│  • Insert new preferences                                          │
│  • Return success/error                                            │
│                                                                     │
│  (Will also integrate with:)                                       │
│  POST /api/booking/auto-book (main auto-booking)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Table: user_theatre_preferences                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ id (UUID)          : unique identifier                     │   │
│  │ user_id (UUID)     : who owns this preference              │   │
│  │ theatre_id (UUID)  : which theatre (1 of 3)               │   │
│  │ priority (1-3)     : priority order 🥇 🥈 🥉              │   │
│  │ created_at         : timestamp                             │   │
│  │ updated_at         : timestamp                             │   │
│  │                                                             │   │
│  │ CONSTRAINTS:                                                │   │
│  │ • Max 3 theatres per user (priority 1-3)                   │   │
│  │ • No duplicate theatres per user                           │   │
│  │ • User auto-deleted when user deleted                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  RLS POLICIES (Row Level Security)          ← YOU ARE HERE  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ✅ SELECT: Users can READ their own prefs  (Missing → 🔴)   │   │
│  │ ✅ INSERT: Users can INSERT their prefs    (Missing → 🔴)   │   │
│  │ ✅ UPDATE: Users can UPDATE their prefs    (Missing → 🔴)   │   │
│  │ ✅ DELETE: Users can DELETE their prefs    (Missing → 🔴)   │   │
│  │ ❌ BLOCK: Users CANNOT access others'      (Working → 🟢)   │   │
│  │                                                             │   │
│  │ 🔴 = Causes "Delete error: {}" problem                     │   │
│  │ 🟢 = Working as expected                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fix Flow Diagram

```
PROBLEM IDENTIFICATION:
  ┌──────────────────────────────────────────┐
  │ User sees: "Delete error: {}"            │
  │ In console after clicking Save           │
  └──────────────────────────────────────────┘
              ↓ Root Cause Analysis
  ┌──────────────────────────────────────────┐
  │ Supabase is blocking access              │
  │ RLS Policies don't exist                 │
  │ User has no permission to delete/insert  │
  └──────────────────────────────────────────┘

SOLUTION PATH:
  ┌──────────────────────────────────────────┐
  │ Step 1: Run script 018 in Supabase       │
  │ (Creates RLS policies)                   │
  └──────────────────────────────────────────┘
              ↓
  ┌──────────────────────────────────────────┐
  │ Step 2: SQL creates 4 policies:          │
  │ • READ for authenticated users           │
  │ • INSERT for authenticated users         │
  │ • UPDATE for authenticated users         │
  │ • DELETE for authenticated users         │
  └──────────────────────────────────────────┘
              ↓
  ┌──────────────────────────────────────────┐
  │ Step 3: Policies check auth.uid()        │
  │ Match between user and preferences       │
  │ IF match → ALLOW                         │
  │ IF no match → DENY                       │
  └──────────────────────────────────────────┘
              ↓
  ┌──────────────────────────────────────────┐
  │ Step 4: Test in app again                │
  │ Save preferences → No error              │
  │ See success toast                        │
  │ Preferences appear                       │
  └──────────────────────────────────────────┘
              ↓
  ┌──────────────────────────────────────────┐
  │ ✅ FIXED - System working correctly!     │
  └──────────────────────────────────────────┘
```

---

## RLS Policy Logic Diagram

```
USER A SAVES PREFERENCES:
┌─────────────────┐
│ User A (logged in)
└────────┬────────┘
         │
         ├──→ auth.uid() = "user-a-id"
         │
         ├──→ SELECT policy checks: 
         │   WHERE auth.uid() = user_id
         │   → ✅ ALLOW (user-a-id = user-a-id)
         │
         ├──→ DELETE policy checks:
         │   WHERE auth.uid() = user_id
         │   → ✅ ALLOW (user-a-id = user-a-id)
         │
         ├──→ INSERT policy checks:
         │   WITH CHECK auth.uid() = user_id
         │   → ✅ ALLOW (user-a-id = user-a-id)
         │
         └──→ Result: Preferences saved ✅

USER B TRYING TO READ USER A'S PREFERENCES:
┌─────────────────┐
│ User B (logged in)
└────────┬────────┘
         │
         ├──→ auth.uid() = "user-b-id"
         │
         ├──→ SELECT policy checks:
         │   WHERE auth.uid() = user_id
         │   → ❌ DENY (user-b-id ≠ user-a-id)
         │
         └──→ Result: Cannot see user A's prefs ✅ (Secure!)
```

---

## Data Flow Diagram

```
SAVING PREFERENCES:

1. User Interface
   ├─ User clicks: "Theatre 1" ← Priority 1 (🥇)
   ├─ User clicks: "Theatre 2" ← Priority 2 (🥈)
   ├─ User clicks: "Theatre 3" ← Priority 3 (🥉)
   └─ User clicks: "SAVE" button

2. State Management
   ├─ selectedTheatres = {
   │    "theatre-1-id": 1,
   │    "theatre-2-id": 2,
   │    "theatre-3-id": 3
   │  }

3. API Request
   ├─ POST /api/auto-book/preferences
   ├─ Body: { preferences: [...selected theatres...] }
   ├─ Auth: Bearer token (contains user ID)

4. Supabase Processing
   ├─ Extract user ID from token: "user-123"
   ├─ Check auth: ✅ User is logged in
   ├─ Validate preferences: ✅ Max 3, valid priorities
   ├─ DELETE existing WHERE user_id = "user-123"
   │  ├─ Check policy: auth.uid() = "user-123" ✅ ALLOW
   │  └─ DELETE completed
   ├─ INSERT new preferences
   │  ├─ Check policy: auth.uid() = "user-123" ✅ ALLOW
   │  └─ INSERT completed

5. Response to Client
   ├─ Status: 200 ✅
   ├─ Body: { success: true, message: "Preferences saved" }

6. UI Updates
   ├─ Show success toast
   ├─ Redirect to /auto-book
   ├─ Display preferences card
   └─ Fetch and show saved theatres
```

---

## Error States Diagram

```
ERROR SCENARIOS:

┌─────────────────────────────┐
│ "Delete error: {}"          │ ← Empty object means RLS blocked
└─────────────────────────────┘
        ↓ Diagnosis Tree
        │
    ┌───┴───┐
    │       │
    ↓       ↓
   YES     NO
   │       │
   ├─→ Is table existing?              ├─→ Run script 017 first
   │   ├─ YES → check policies         
   │   └─ NO → Not your error           
   │
   ├─→ Are RLS policies created? (4 policies)
   │   ├─ YES (4 policies) → check auth
   │   ├─ PARTIAL (1-3 policies) → Run script 018 again
   │   └─ NO (0 policies) → Run script 018
   │
   ├─→ Is user authenticated?
   │   ├─ YES → Try saving again
   │   └─ NO → Must login first
   │
   └─→ Still failing?
       └─ Run diagnostic script 000
```

---

## Before & After Comparison

```
BEFORE RUNNING RLS SETUP:
┌────────────────────────────────────────────┐
│ User tries to SAVE preferences             │
├────────────────────────────────────────────┤
│ Supabase receives DELETE request           │
│ └─→ Checks RLS policies for DELETE         │
│     └─→ No policies exist → DENY ❌        │
│         └─→ Returns empty error: {}        │
│             └─→ Browser shows error       │
│                 └─→ User confused 😕      │
└────────────────────────────────────────────┘

AFTER RUNNING RLS SETUP:
┌────────────────────────────────────────────┐
│ User tries to SAVE preferences             │
├────────────────────────────────────────────┤
│ Supabase receives DELETE request           │
│ └─→ Checks RLS policies for DELETE         │
│     └─→ Policy 4 exists: DELETE policy ✅  │
│         └─→ Checks: auth.uid() = user_id  │
│             └─→ Matches! → ALLOW ✅       │
│                 └─→ DELETE executed       │
│                     └─→ INSERT executed   │
│                         └─→ Success! 🎉  │
└────────────────────────────────────────────┘
```

---

## Script Execution Sequence

```
RUN IN THIS ORDER:

1️⃣ CHECK TABLE EXISTS
   ├─ Verify user_theatre_preferences table
   ├─ If missing → Run script 017
   └─ If exists → Continue

2️⃣ CREATE RLS POLICIES ⭐ CRITICAL
   ├─ Run script 018
   ├─ Expected: 4 policies created
   ├─ Creates all access rules
   └─ This fixes "Delete error: {}"

3️⃣ VERIFY SETUP (Optional)
   ├─ Run script 000 (diagnostic)
   ├─ Should see "✅ ALL CHECKS PASSED"
   ├─ Confirms everything is working
   └─ Safe to run anytime
```

---

## Status Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPONENT STATUS SUMMARY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Database Table           ✅ CREATED    (Script 017)             │
│ User Interface           ✅ BUILT      (Preferences page)       │
│ API Endpoint             ✅ READY      (Will auto-load prefs)   │
│ Core Logic               ✅ READY      (Fallback algorithm)     │
│ Error Handling           ✅ ADDED      (Enhanced logging)        │
│ Documentation            ✅ COMPLETE   (5+ guides)              │
│ RLS Policies             ❌ PENDING    (Run script 018)         │
│ User Permission          ❌ BLOCKED    (Until RLS setup)        │
│ Preferences Saving       ❌ ERROR      (Delete error: {})       │
│ Preferences Display      ⏳ AWAITING   (Once save works)        │
│ Auto-Booking Integration ⏳ READY      (Instructions provided)  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ NEXT ACTION: Run scripts/018_setup_rls_theatre_preferences.sql │
│             in Supabase SQL Editor                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Decision Tree

```
START HERE
    │
    ├─ Do you see "Delete error: {}"?
    │  ├─ YES → Run script 018 (RLS setup) ⭐
    │  └─ NO → Check diagnostic script output
    │
    ├─ Does script 018 complete successfully?
    │  ├─ YES → Test save in app
    │  └─ NO → Check Supabase SQL Editor output for errors
    │
    ├─ Does save work now?
    │  ├─ YES → Preferences are working ✅
    │  └─ NO → Run diagnostic script 000
    │
    ├─ Does diagnostic show "✅ ALL CHECKS PASSED"?
    │  ├─ YES → Issue is in app code → check browser console
    │  └─ NO → Issue is in Supabase → check which check failed
    │
    └─ Still need help?
       └─ See: THEATRE_PREFERENCES_SETUP.md → Troubleshooting
```

---

## File Reference Map

```
WHERE TO FIND WHAT:

Quick Help?
└─ QUICK_FIX_THEATRE_PREFERENCES.md (5 min read) ⚡

Complete Setup Guide?
└─ THEATRE_PREFERENCES_SETUP.md (20 min read) 📖

Need Context on Everything?
└─ THEATRE_PREFERENCES_STATUS.md (10 min read) 📋

Want to Integrate with Auto-Booking?
└─ INTEGRATE_PREFERENCES_GUIDE.md (15 min read) 🔗

SQL Scripts Needed?
├─ scripts/017_add_theatre_preferences_table.sql (Table)
├─ scripts/018_setup_rls_theatre_preferences.sql (RLS - CRITICAL) ⭐
└─ scripts/000_diagnose_preferences_setup.sql (Diagnostic)

Navigation Help?
└─ PREFERENCES_SYSTEM_INDEX.md (Main index) 📑
```

---

## Visual Checklist

```
GETTING THEATRE PREFERENCES WORKING:

Phase 1: Setup
  ☐ Table created (script 017)
  ☐ RLS policies created (script 018) ⭐
  ☐ Verified with diagnostic (script 000)

Phase 2: Testing
  ☐ Can navigate to /auto-book/preferences
  ☐ Can select 3 theatres
  ☐ Can save without "Delete error" ✅
  ☐ Success toast appears
  ☐ Redirects to /auto-book

Phase 3: Verification
  ☐ Preferences display on /auto-book page
  ☐ Preferences persist after refresh
  ☐ Can edit preferences again
  ☐ Priorities show with badges 🥇 🥈 🥉

Phase 4: Integration (Optional)
  ☐ Read INTEGRATE_PREFERENCES_GUIDE.md
  ☐ Update auto-booking API to load preferences
  ☐ Update core logic to try preferred theatres first
  ☐ Test end-to-end booking flow
  ☐ Verify fallback to other theatres works
```

---

**Status:** All diagnostics and fixes ready  
**Your Current Issue:** Missing RLS policies → Run script 018  
**Time to Fix:** ~6 minutes  
**Expected Result:** Preferences save successfully
