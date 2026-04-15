
INSERT INTO storage.buckets (id, name, public) VALUES ('championship-logos', 'championship-logos', true);

CREATE POLICY "Championship logos are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'championship-logos');

CREATE POLICY "Authenticated users can upload championship logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'championship-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own championship logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'championship-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own championship logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'championship-logos' AND auth.uid() IS NOT NULL);
