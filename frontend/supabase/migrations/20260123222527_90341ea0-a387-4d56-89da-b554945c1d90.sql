-- Fix RLS policy for profile updates - add WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a function to ensure profile exists for a user
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile if it doesn't exist
    INSERT INTO public.profiles (id)
    VALUES (auth.uid())
    ON CONFLICT (id) DO NOTHING;
END;
$$;