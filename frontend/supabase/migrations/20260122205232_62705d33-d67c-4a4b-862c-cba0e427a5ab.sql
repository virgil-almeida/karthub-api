-- Fix the handle_new_user trigger to NOT pre-fill data from email
-- New pilots should have empty profiles that they fill in themselves

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
        -- Only use full_name from metadata if explicitly provided, otherwise NULL
        CASE 
          WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
               AND TRIM(NEW.raw_user_meta_data->>'full_name') != ''
          THEN SUBSTRING(TRIM(NEW.raw_user_meta_data->>'full_name'), 1, 255)
          ELSE NULL
        END,
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