-- =====================================================
-- Add latitude and longitude columns to complaints table
-- =====================================================

ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;
