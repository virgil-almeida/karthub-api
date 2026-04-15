-- Fix 1: Profiles table - require authentication for SELECT
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users only"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Championship members - respect private championship privacy
DROP POLICY IF EXISTS "Members viewable by championship participants" ON public.championship_members;

CREATE POLICY "Members viewable based on championship privacy"
ON public.championship_members FOR SELECT
USING (
  -- Public championships: anyone authenticated can see members
  EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = championship_members.championship_id
    AND c.is_private = false
    AND auth.uid() IS NOT NULL
  )
  OR
  -- Private championships: only members, organizers, or admins can see
  EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = championship_members.championship_id
    AND c.is_private = true
    AND (
      c.organizer_id = auth.uid()
      OR championship_members.profile_id = auth.uid()
      OR is_admin()
    )
  )
  OR
  -- User can always see their own membership
  profile_id = auth.uid()
);

-- Fix 3: Heat results - restrict payment_status visibility
-- Create a helper function to check if user can see payment status
CREATE OR REPLACE FUNCTION public.can_view_payment_status(p_heat_id uuid, p_driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin can see all
    is_admin()
    OR
    -- Driver can see their own payment status
    p_driver_id = auth.uid()
    OR
    -- Championship organizer can see
    EXISTS (
      SELECT 1 
      FROM public.heats h
      JOIN public.events e ON e.id = h.event_id
      JOIN public.championships c ON c.id = e.championship_id
      WHERE h.id = p_heat_id
      AND c.organizer_id = auth.uid()
    )
$$;

-- Create a view for public heat results without payment_status
CREATE OR REPLACE VIEW public.heat_results_public
WITH (security_invoker = true) AS
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
  created_at,
  -- Only show payment_status to authorized users
  CASE 
    WHEN can_view_payment_status(heat_id, driver_id) THEN payment_status
    ELSE NULL
  END AS payment_status
FROM public.heat_results;

-- Grant access to the view
GRANT SELECT ON public.heat_results_public TO authenticated;

-- Update heat_results SELECT policy to require authentication
DROP POLICY IF EXISTS "Results are viewable by everyone" ON public.heat_results;

CREATE POLICY "Results viewable by authenticated users"
ON public.heat_results FOR SELECT
USING (auth.uid() IS NOT NULL);