-- Fix 1: Restrict lap_telemetry to authenticated users only
-- Drop the overly permissive policy and create a new one requiring authentication
DROP POLICY IF EXISTS "Telemetry is viewable by everyone" ON public.lap_telemetry;

CREATE POLICY "Telemetry is viewable by authenticated users"
ON public.lap_telemetry
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Note: heat_results_public is a view with security_invoker=on
-- It correctly inherits RLS from the base heat_results table
-- The view excludes payment_status, so only public race data is exposed
-- The base table's RLS policies ensure proper access control

-- Note: heat_results payment_status exposure is mitigated because:
-- 1. The heat_results_public view excludes payment_status entirely
-- 2. Direct access to heat_results requires being the driver, organizer, or admin
-- 3. The can_view_payment_status() RPC provides additional server-side validation