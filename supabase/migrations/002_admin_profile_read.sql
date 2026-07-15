-- =====================================================
-- EMERGENCY: Drop the recursive policy (run this NOW)
-- =====================================================
-- The previous "Admins can read all profiles" policy causes infinite recursion:
-- reading profiles checks the policy → policy reads profiles → loops forever.
-- This blocks getCurrentProfile() for ALL users → everyone gets logged out.

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- =====================================================
-- SAFE REPLACEMENT: use a SECURITY DEFINER function
-- =====================================================
-- A SECURITY DEFINER function runs as its owner (postgres/superuser),
-- bypassing RLS on its own queries. No recursion possible.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Now the policy is safe — it calls the function instead of querying profiles directly
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
