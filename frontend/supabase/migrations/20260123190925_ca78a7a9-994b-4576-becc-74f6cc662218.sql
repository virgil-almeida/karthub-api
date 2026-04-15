-- Fix: Restrict heat_results base table to only those authorized to see payment_status
-- Public race results should use heat_results_public view (which excludes payment_status)

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Heat results viewable by authorized users only" ON public.heat_results;

-- Create a more restrictive policy that only allows access to those who need payment_status
-- This aligns with the can_view_payment_status function logic:
-- - Admins can see all
-- - Drivers can see their own results
-- - Championship organizers can see their championship results
CREATE POLICY "Heat results restricted to authorized users"
ON public.heat_results
FOR SELECT
USING (
  is_admin()
  OR
  driver_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 
    FROM public.heats h
    JOIN public.events e ON e.id = h.event_id
    JOIN public.championships c ON c.id = e.championship_id
    WHERE h.id = heat_results.heat_id
    AND c.organizer_id = auth.uid()
  )
);