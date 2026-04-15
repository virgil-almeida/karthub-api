-- Create a public view for championships that hides raw organizer_id
-- and instead exposes only the organizer's public display name

CREATE OR REPLACE VIEW public.championships_public AS
SELECT 
  c.id,
  c.name,
  c.logo_url,
  c.rules_summary,
  c.is_private,
  c.created_at,
  c.updated_at,
  -- Expose organizer's display name instead of raw UUID
  COALESCE(p.full_name, p.username, 'Organizador') as organizer_name,
  p.avatar_url as organizer_avatar_url
FROM public.championships c
LEFT JOIN public.profiles p ON c.organizer_id = p.id
WHERE c.is_private = false OR c.organizer_id = auth.uid();

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.championships_public TO authenticated;
GRANT SELECT ON public.championships_public TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.championships_public IS 'Public view of championships that exposes organizer display name instead of raw UUID for privacy. Use this view for public listings.';