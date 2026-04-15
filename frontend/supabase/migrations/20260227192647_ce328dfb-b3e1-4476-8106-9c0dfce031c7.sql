
-- ============================================
-- FASE 1: Storage bucket for avatars
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Users can upload their own avatar (folder = their user id)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars are publicly viewable
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- ============================================
-- FASE 2: Social columns on profiles
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN instagram text,
ADD COLUMN youtube text,
ADD COLUMN tiktok text,
ADD COLUMN website text;

-- ============================================
-- FASE 4: Feature visibility table
-- ============================================
CREATE TABLE public.feature_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  min_tier public.subscription_tier NOT NULL DEFAULT 'free',
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_visibility ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature visibility settings
CREATE POLICY "Feature visibility readable by everyone"
ON public.feature_visibility FOR SELECT
USING (true);

-- Only admins can manage feature visibility
CREATE POLICY "Admins can manage feature visibility"
ON public.feature_visibility FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Seed default feature visibility settings
INSERT INTO public.feature_visibility (feature_key, min_tier, label) VALUES
  ('profile_standalone_races', 'free', 'Corridas Avulsas & Treinos'),
  ('profile_badges', 'free', 'Conquistas'),
  ('profile_social_links', 'free', 'Redes Sociais'),
  ('profile_stats', 'free', 'Estatísticas Detalhadas'),
  ('profile_website', 'plus', 'Website Pessoal');
