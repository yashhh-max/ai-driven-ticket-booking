-- THEATRE PREFERENCES DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to verify your setup
-- Copy and run the entire script - it's safe (only selects, no modifications)

-- ============================================
-- 1. CHECK TABLE EXISTS
-- ============================================
DO $$ 
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_theatre_preferences'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ TABLE EXISTS: user_theatre_preferences';
  ELSE
    RAISE NOTICE '❌ TABLE MISSING: user_theatre_preferences - Run script 017 first';
  END IF;
END $$;

-- ============================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📋 TABLE STRUCTURE:';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_theatre_preferences'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK RLS IS ENABLED
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '🔒 ROW LEVEL SECURITY STATUS:';

SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_theatre_preferences';

-- ============================================
-- 4. CHECK RLS POLICIES
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📝 RLS POLICIES:';

SELECT 
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_theatre_preferences';

-- Show all policies
SELECT 
  policy_name,
  cmd as operation,
  qual as condition,
  with_check as insert_update_condition
FROM pg_policies 
WHERE tablename = 'user_theatre_preferences'
ORDER BY policy_name;

-- ============================================
-- 5. CHECK CONSTRAINTS
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '⚠️ CONSTRAINTS:';

SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_theatre_preferences'
ORDER BY constraint_name;

-- ============================================
-- 6. CHECK INDEXES
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '🔍 INDEXES:';

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_theatre_preferences'
ORDER BY indexname;

-- ============================================
-- 7. AUTO-FIX RECOMMENDATIONS
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📋 AUTO-FIX SUGGESTIONS:';

-- Check if RLS is properly configured
DO $$
DECLARE
  policy_count INT;
  rls_enabled BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_theatre_preferences'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE '❌ TABLE MISSING - ACTION: Run script 017_add_theatre_preferences_table.sql';
  ELSE
    SELECT rowsecurity INTO rls_enabled 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'user_theatre_preferences';
    
    IF NOT rls_enabled THEN
      RAISE NOTICE '❌ RLS DISABLED - ACTION: Run "ALTER TABLE user_theatre_preferences ENABLE ROW LEVEL SECURITY;"';
    ELSE
      SELECT COUNT(*) INTO policy_count 
      FROM pg_policies 
      WHERE tablename = 'user_theatre_preferences';
      
      IF policy_count = 0 THEN
        RAISE NOTICE '❌ NO POLICIES FOUND - ACTION: Run script 018_setup_rls_theatre_preferences.sql';
      ELSIF policy_count < 4 THEN
        RAISE NOTICE '⚠️ ONLY ' || policy_count || ' POLICIES (expected 4) - ACTION: Run script 018_setup_rls_theatre_preferences.sql';
      ELSE
        RAISE NOTICE '✅ ALL CHECKS PASSED - Theatre preferences setup is complete!';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================
-- 8. SAMPLE DATA VERIFICATION
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📊 DATA VERIFICATION:';

SELECT 
  (SELECT COUNT(*) FROM user_theatre_preferences) as total_preferences,
  (SELECT COUNT(DISTINCT user_id) FROM user_theatre_preferences) as users_with_preferences,
  (SELECT COUNT(DISTINCT theatre_id) FROM user_theatre_preferences) as theatres_used;

-- ============================================
-- DIAGNOSTIC COMPLETE
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '✅ DIAGNOSTIC COMPLETE - Review suggestions above';
