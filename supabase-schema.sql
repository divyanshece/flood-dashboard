-- ============================================
-- FloodLens Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: profiles (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  institution TEXT,
  role TEXT DEFAULT 'researcher' CHECK (role IN ('researcher', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Table: data_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.data_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Requester Information
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  institution TEXT NOT NULL,

  -- Request Details
  purpose TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  data_description TEXT,
  export_format TEXT DEFAULT 'csv' CHECK (export_format IN ('csv', 'excel', 'both')),

  -- Status Management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comments TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Approval Details
  approval_valid_until TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own requests" ON public.data_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.data_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.data_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.data_requests;

-- Policies for data_requests
CREATE POLICY "Users can view own requests" ON public.data_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON public.data_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.data_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" ON public.data_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Table: data_request_downloads (audit log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.data_request_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.data_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  download_format TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_request_downloads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own downloads" ON public.data_request_downloads;
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.data_request_downloads;
DROP POLICY IF EXISTS "Users can create downloads" ON public.data_request_downloads;

-- Policies for downloads
CREATE POLICY "Users can view own downloads" ON public.data_request_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads" ON public.data_request_downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create downloads" ON public.data_request_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTE: Flood events data remains in SQLite database (flood_hyderabad.db)
-- This Supabase schema only handles auth, profiles, and data access requests

-- ============================================
-- Function: Handle new user signup
-- Automatically creates profile and sets admin for specific email
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email = 'divyanshece242@gmail.com' THEN 'admin'
      ELSE 'researcher'
    END,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Function: Update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_data_requests_updated_at ON public.data_requests;
CREATE TRIGGER update_data_requests_updated_at
  BEFORE UPDATE ON public.data_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Function: Increment download count
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_download_count(request_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.data_requests
  SET download_count = download_count + 1
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_data_requests_user_id ON public.data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON public.data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_created_at ON public.data_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
-- NOTE: flood_events table is in SQLite, not Supabase

-- ============================================
-- Set admin role for specific emails (run for existing users)
-- ============================================
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email IN ('divyanshece242@gmail.com')
  AND role != 'admin';

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
