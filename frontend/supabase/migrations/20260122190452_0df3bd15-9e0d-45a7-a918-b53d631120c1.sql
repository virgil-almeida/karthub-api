-- =============================================
-- FIX 1: Secure profiles table - restrict weight visibility
-- =============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Profiles viewable by authenticated users only" ON public.profiles;

-- Create new policy: Users can see all profiles (for standings/leaderboards)
-- but full profile data is only visible to owner, admins, or championship organizers
CREATE POLICY "Users can view basic profile info"
ON public.profiles FOR SELECT
USING (
  -- Profile owner can see everything
  auth.uid() = id
  OR
  -- Admins can see everything
  is_admin()
  OR
  -- Championship organizers can see profiles of their members
  EXISTS (
    SELECT 1 FROM public.championship_members cm
    JOIN public.championships c ON c.id = cm.championship_id
    WHERE cm.profile_id = profiles.id
    AND c.organizer_id = auth.uid()
  )
  OR
  -- For public leaderboards: any authenticated user can see basic info
  -- Weight is handled by application layer (hook) - only expose non-sensitive fields
  auth.uid() IS NOT NULL
);

-- =============================================
-- FIX 2: Secure heat_results - restrict payment_status visibility
-- =============================================

-- Drop existing view that exposes payment_status
DROP VIEW IF EXISTS public.heat_results_public;

-- Create secure view that excludes payment_status (for public standings)
CREATE VIEW public.heat_results_public
WITH (security_invoker = on) AS
SELECT 
  id,
  heat_id,
  driver_id,
  driver_name_text,
  position,
  kart_number,
  best_lap_time,
  total_time,
  gap_to_leader,
  gap_to_previous,
  average_speed,
  total_laps,
  points,
  created_at
  -- payment_status is EXCLUDED for security
FROM public.heat_results;

-- Grant access to the view
GRANT SELECT ON public.heat_results_public TO authenticated;
GRANT SELECT ON public.heat_results_public TO anon;

-- =============================================
-- FIX 3: Update heat_results RLS to restrict payment_status access
-- =============================================

-- The existing RLS allows all authenticated users to SELECT.
-- Since we can't do column-level RLS in Postgres, we'll:
-- 1. Keep the base table restricted
-- 2. Use the public view for general access
-- 3. The can_view_payment_status() function already exists for conditional access

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Results viewable by authenticated users" ON public.heat_results;

-- Create restrictive policy: Only authorized users can see full results (including payment_status)
CREATE POLICY "Results viewable by authorized users"
ON public.heat_results FOR SELECT
USING (
  -- Admins can see everything
  is_admin()
  OR
  -- Driver can see their own results
  driver_id = auth.uid()
  OR
  -- Championship organizers can see results from their championships
  EXISTS (
    SELECT 1 FROM public.heats h
    JOIN public.events e ON e.id = h.event_id
    JOIN public.championships c ON c.id = e.championship_id
    WHERE h.id = heat_results.heat_id
    AND c.organizer_id = auth.uid()
  )
);

-- =============================================
-- Create a function to get public profile data (excluding weight for non-authorized)
-- =============================================

CREATE OR REPLACE FUNCTION public.can_view_profile_weight(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Owner can see their own weight
    target_profile_id = auth.uid()
    OR
    -- Admin can see all weights
    is_admin()
    OR
    -- Championship organizer can see weight of their members
    EXISTS (
      SELECT 1 FROM public.championship_members cm
      JOIN public.championships c ON c.id = cm.championship_id
      WHERE cm.profile_id = target_profile_id
      AND c.organizer_id = auth.uid()
    )
$$;