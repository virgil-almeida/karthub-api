-- Fix 1: Restrict profiles table SELECT to authorized users only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;

-- Create restrictive policy: only owner, admin, or organizers of shared championships can view full profiles
CREATE POLICY "Authorized users can view profiles"
ON public.profiles
FOR SELECT
USING (
  -- Owner can always view their own profile
  auth.uid() = id
  OR
  -- Admins can view all profiles
  is_admin()
  OR
  -- Championship organizers can view profiles of their members
  EXISTS (
    SELECT 1 FROM public.championship_members cm
    JOIN public.championships c ON c.id = cm.championship_id
    WHERE cm.profile_id = profiles.id
    AND c.organizer_id = auth.uid()
  )
  OR
  -- Members of the same championship can view each other's basic profile
  EXISTS (
    SELECT 1 FROM public.championship_members my_membership
    JOIN public.championship_members their_membership 
      ON my_membership.championship_id = their_membership.championship_id
    WHERE my_membership.profile_id = auth.uid()
    AND their_membership.profile_id = profiles.id
  )
);

-- Fix 2: Restrict heat_results SELECT to hide payment_status from competitors
-- Drop the current policy that exposes payment_status
DROP POLICY IF EXISTS "Results viewable by authorized users" ON public.heat_results;

-- Create new policy: restrict direct table access to admin, driver, and organizer
-- Competitors should use the heat_results_public view which excludes payment_status
CREATE POLICY "Heat results viewable by authorized users only"
ON public.heat_results
FOR SELECT
USING (
  -- Admins can see all results including payment status
  is_admin()
  OR
  -- Drivers can see their own results including payment status
  driver_id = auth.uid()
  OR
  -- Championship organizers can see all results for their championships
  EXISTS (
    SELECT 1 FROM heats h
    JOIN events e ON e.id = h.event_id
    JOIN championships c ON c.id = e.championship_id
    WHERE h.id = heat_results.heat_id
    AND c.organizer_id = auth.uid()
  )
);