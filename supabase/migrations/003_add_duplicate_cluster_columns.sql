-- =====================================================
-- Migration 003: Duplicate / Cluster Detection
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1. Add cluster columns to complaints table
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS cluster_id    UUID,
  ADD COLUMN IF NOT EXISTS is_duplicate  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of  UUID REFERENCES public.complaints(id) ON DELETE SET NULL;

-- 2. Index for fast cluster lookups
CREATE INDEX IF NOT EXISTS idx_complaints_cluster_id   ON public.complaints(cluster_id);
CREATE INDEX IF NOT EXISTS idx_complaints_duplicate_of ON public.complaints(duplicate_of);

-- 3. nearby_complaints(lat, lng, dept_id, radius_meters, days_back)
--    Uses the Haversine formula to find open complaints in the same department
--    within radius_meters of the given coordinates, created within the last days_back days.
--    Returns id, priority, cluster_id, is_duplicate, duplicate_of for each match.
CREATE OR REPLACE FUNCTION public.nearby_complaints(
  lat          float8,
  lng          float8,
  dept_id      uuid,
  radius_m     float8,
  days_back    int
)
RETURNS TABLE (
  id           uuid,
  priority     text,
  cluster_id   uuid,
  is_duplicate boolean,
  duplicate_of uuid,
  raw_text     text,
  created_at   timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.priority,
    c.cluster_id,
    c.is_duplicate,
    c.duplicate_of,
    c.raw_text,
    c.created_at
  FROM public.complaints c
  WHERE
    -- same department
    c.department_id = dept_id

    -- exclude resolved / rejected
    AND c.status NOT IN ('resolved', 'rejected')

    -- created within the last N days
    AND c.created_at >= now() - (days_back || ' days')::interval

    -- has coordinates
    AND c.latitude  IS NOT NULL
    AND c.longitude IS NOT NULL

    -- Haversine distance <= radius_m metres
    -- R = 6 371 000 m
    AND (
      2 * 6371000 * asin(
        sqrt(
          power(sin(radians((c.latitude  - lat)  / 2)), 2)
          + cos(radians(lat)) * cos(radians(c.latitude))
          * power(sin(radians((c.longitude - lng) / 2)), 2)
        )
      )
    ) <= radius_m
$$;
