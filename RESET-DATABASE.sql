-- ============================================
-- COMPLETE DATABASE RESET - RUN THIS IN SUPABASE SQL EDITOR
-- This will fix ALL issues with data requests
-- ============================================

-- Step 1: Drop ALL existing policies (safe - no error if they don't exist)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "data_requests_select_all" ON public.data_requests;
DROP POLICY IF EXISTS "data_requests_insert_all" ON public.data_requests;
DROP POLICY IF EXISTS "data_requests_update_all" ON public.data_requests;
DROP POLICY IF EXISTS "data_requests_delete_all" ON public.data_requests;
DROP POLICY IF EXISTS "downloads_select_all" ON public.data_request_downloads;
DROP POLICY IF EXISTS "downloads_insert_all" ON public.data_request_downloads;

-- Drop any other policies that might exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- Step 2: Disable then enable RLS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_request_downloads DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_request_downloads ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SIMPLE open policies

-- PROFILES - Simple open policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- DATA_REQUESTS - Open for all operations (admin via API)
CREATE POLICY "data_requests_select_all" ON public.data_requests FOR SELECT USING (true);
CREATE POLICY "data_requests_insert_all" ON public.data_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "data_requests_update_all" ON public.data_requests FOR UPDATE USING (true);
CREATE POLICY "data_requests_delete_all" ON public.data_requests FOR DELETE USING (true);

-- DATA_REQUEST_DOWNLOADS - Open for all operations
CREATE POLICY "downloads_select_all" ON public.data_request_downloads FOR SELECT USING (true);
CREATE POLICY "downloads_insert_all" ON public.data_request_downloads FOR INSERT WITH CHECK (true);

-- Step 4: Verify the setup
SELECT 'Policies created successfully!' as status;
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Step 5: Check existing data
SELECT 'Data Requests:' as table_name, count(*) as count FROM public.data_requests;
SELECT 'Profiles:' as table_name, count(*) as count FROM public.profiles;
