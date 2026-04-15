-- Fix 1: Update handle_new_user() with input validation for SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        -- Sanitize and limit length to 255 chars
        COALESCE(
          NULLIF(TRIM(SUBSTRING(NEW.raw_user_meta_data->>'full_name', 1, 255)), ''),
          SPLIT_PART(NEW.email, '@', 1)
        ),
        -- Validate URL format (must start with http:// or https://), limit to 500 chars
        CASE 
          WHEN NEW.raw_user_meta_data->>'avatar_url' ~ '^https?://'
          THEN SUBSTRING(NEW.raw_user_meta_data->>'avatar_url', 1, 500)
          ELSE NULL
        END
    );
    RETURN NEW;
END;
$$;

-- Fix 2: Add CHECK constraints for input validation on profiles table
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 5000),
  ADD CONSTRAINT profiles_weight_range CHECK (weight IS NULL OR (weight > 0 AND weight < 500)),
  ADD CONSTRAINT profiles_username_length CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 50)),
  ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR length(full_name) <= 255),
  ADD CONSTRAINT profiles_avatar_url_length CHECK (avatar_url IS NULL OR length(avatar_url) <= 500);

-- Fix 3: Add CHECK constraints for championships table
ALTER TABLE public.championships
  ADD CONSTRAINT championships_name_length CHECK (length(name) >= 1 AND length(name) <= 200),
  ADD CONSTRAINT championships_rules_length CHECK (rules_summary IS NULL OR length(rules_summary) <= 10000),
  ADD CONSTRAINT championships_logo_url_length CHECK (logo_url IS NULL OR length(logo_url) <= 500);

-- Fix 4: Add CHECK constraints for heat_results table
ALTER TABLE public.heat_results
  ADD CONSTRAINT heat_results_position_positive CHECK (position > 0),
  ADD CONSTRAINT heat_results_kart_number_range CHECK (kart_number IS NULL OR (kart_number > 0 AND kart_number < 1000)),
  ADD CONSTRAINT heat_results_points_non_negative CHECK (points IS NULL OR points >= 0);

-- Fix 5: Add CHECK constraints for events table
ALTER TABLE public.events
  ADD CONSTRAINT events_name_length CHECK (length(name) >= 1 AND length(name) <= 200);

-- Fix 6: Add CHECK constraints for heats table
ALTER TABLE public.heats
  ADD CONSTRAINT heats_name_length CHECK (length(name) >= 1 AND length(name) <= 200);

-- Fix 7: Add CHECK constraints for tracks table
ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_name_length CHECK (length(name) >= 1 AND length(name) <= 200),
  ADD CONSTRAINT tracks_location_length CHECK (length(location) >= 1 AND length(location) <= 500),
  ADD CONSTRAINT tracks_length_meters_positive CHECK (length_meters IS NULL OR length_meters > 0);

-- Fix 8: Tighten user_roles SELECT policy to prevent admin enumeration
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Separate policies for users viewing their own roles and admins viewing all
CREATE POLICY "Users can view own roles only" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (is_admin());