-- =====================================================
-- Civic Grievance System — Initial Schema Migration
-- Run this in your Supabase SQL Editor (or as a migration)
-- =====================================================

-- ============================
-- 1. DEPARTMENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed departments
INSERT INTO public.departments (name) VALUES
  ('Water Supply'),
  ('Electricity'),
  ('Roads'),
  ('Sanitation'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================
-- 2. PROFILES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- 3. COMPLAINTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  category TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'in_review', 'assigned', 'resolved', 'rejected')),
  priority TEXT CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high')),
  location_text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update `updated_at` on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- 4. COMPLAINT UPDATES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  status_at_time TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- 5. INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint_id ON public.complaint_updates(complaint_id);

-- ============================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

-- ---------- PROFILES ----------

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------- DEPARTMENTS ----------

-- Everyone authenticated can read departments (needed for dropdowns)
CREATE POLICY "Authenticated users can read departments"
  ON public.departments FOR SELECT
  USING (auth.role() = 'authenticated');

-- ---------- COMPLAINTS ----------

-- Citizens can insert their own complaints
CREATE POLICY "Citizens can insert own complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Citizens can read their own complaints
CREATE POLICY "Citizens can read own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = user_id);

-- Officers can read complaints in their department
CREATE POLICY "Officers can read department complaints"
  ON public.complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'officer'
        AND profiles.department_id = complaints.department_id
    )
  );

-- Officers can update complaints in their department
CREATE POLICY "Officers can update department complaints"
  ON public.complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'officer'
        AND profiles.department_id = complaints.department_id
    )
  );

-- Admins can read all complaints
CREATE POLICY "Admins can read all complaints"
  ON public.complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admins can update all complaints
CREATE POLICY "Admins can update all complaints"
  ON public.complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ---------- COMPLAINT UPDATES ----------

-- Citizens can read updates on their own complaints
CREATE POLICY "Citizens can read own complaint updates"
  ON public.complaint_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE complaints.id = complaint_updates.complaint_id
        AND complaints.user_id = auth.uid()
    )
  );

-- Citizens can insert updates on their own complaints (needed for initial submission log)
CREATE POLICY "Citizens can insert own complaint updates"
  ON public.complaint_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE complaints.id = complaint_updates.complaint_id
        AND complaints.user_id = auth.uid()
    )
  );

-- Officers can read updates on their department complaints
CREATE POLICY "Officers can read department complaint updates"
  ON public.complaint_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE complaints.id = complaint_updates.complaint_id
        AND profiles.role = 'officer'
        AND profiles.department_id = complaints.department_id
    )
  );

-- Officers can insert updates on their department complaints
CREATE POLICY "Officers can insert department complaint updates"
  ON public.complaint_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE complaints.id = complaint_updates.complaint_id
        AND profiles.role = 'officer'
        AND profiles.department_id = complaints.department_id
    )
  );

-- Admins can read all complaint updates
CREATE POLICY "Admins can read all complaint updates"
  ON public.complaint_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admins can insert complaint updates on any complaint
CREATE POLICY "Admins can insert any complaint updates"
  ON public.complaint_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================
-- 7. STORAGE BUCKET
-- ============================
-- Create the complaint-images storage bucket with public access
-- NOTE: Run this in the Supabase dashboard > Storage, or via the API:
--   INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-images', 'complaint-images', true);
-- The SQL below works if you have access to the storage schema:
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to complaint-images
CREATE POLICY "Authenticated users can upload complaint images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.role() = 'authenticated'
  );

-- Allow public read access to complaint images
CREATE POLICY "Public can read complaint images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-images');

-- ============================
-- 8. AUTOMATIC PROFILE TRIGGER
-- ============================
-- This trigger automatically creates a profile row in the public.profiles table
-- whenever a new user signs up via Supabase auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, department_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    (NEW.raw_user_meta_data->>'department_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

