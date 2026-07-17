-- =====================================================
-- Migration 004: Add Triage Agent Columns
-- Run this in the Supabase SQL Editor
-- =====================================================

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS ai_reasoning text,
  ADD COLUMN IF NOT EXISTS is_duplicate_of uuid REFERENCES public.complaints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_is_duplicate_of ON public.complaints(is_duplicate_of);
