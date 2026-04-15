
-- Add custom_image_url column to badge_definitions
ALTER TABLE public.badge_definitions ADD COLUMN custom_image_url text;

-- Create badge-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('badge-images', 'badge-images', true);

-- Public read access
CREATE POLICY "Badge images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'badge-images');

-- Admins/moderators can upload
CREATE POLICY "Admins and moderators can upload badge images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'badge-images' AND is_moderator_or_higher());

-- Admins/moderators can update
CREATE POLICY "Admins and moderators can update badge images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'badge-images' AND is_moderator_or_higher());

-- Admins/moderators can delete
CREATE POLICY "Admins and moderators can delete badge images"
ON storage.objects FOR DELETE
USING (bucket_id = 'badge-images' AND is_moderator_or_higher());
