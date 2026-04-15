-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Add policy for admins to delete championships (cascade handled by DB)
-- The existing "Organizers can manage own championships" policy uses is_admin() OR check
-- so admins already have DELETE access

-- Add policy for admins to manage all events (already covered by existing policy)
-- Add policy for admins to manage all heats (already covered by existing policy)
-- Add policy for admins to manage all heat_results (already covered by existing policy)