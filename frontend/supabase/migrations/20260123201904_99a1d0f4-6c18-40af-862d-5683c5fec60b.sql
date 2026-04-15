-- Fix: Recreate heat_results_public view to allow public access
-- The view already excludes sensitive payment_status field
-- We need to remove security_invoker so it doesn't inherit base table's restrictive RLS

-- Drop the existing view
DROP VIEW IF EXISTS public.heat_results_public;

-- Recreate view WITHOUT security_invoker (so it runs with definer's privileges)
-- This is safe because the view explicitly excludes the sensitive payment_status column
CREATE VIEW public.heat_results_public AS
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
FROM public.heat_results;

-- Grant SELECT access to all users (including anonymous)
GRANT SELECT ON public.heat_results_public TO anon, authenticated;