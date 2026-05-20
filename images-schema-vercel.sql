-- =============================================================================
-- JJRK STUDIO — Site Images (Vercel + Supabase)
-- =============================================================================
-- Where: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Project: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy
--
-- Run AFTER (at least once):
--   1. supabase-schema.sql
--   2. fix-rls-policies.sql   (creates is_user_admin)
--
-- Vercel: commit the /images folder (run: node scripts/extract-images.js)
--         Deploy with SUPABASE_URL + SUPABASE_ANON_KEY env vars.
--         fallback_path below matches static files on Vercel (e.g. /images/wedding.jpg).
-- =============================================================================

-- ----- Prerequisite: admin check function -----
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role INTEGER;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role = 1, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon;

-- ----- Table -----
CREATE TABLE IF NOT EXISTS public.site_images (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('team', 'product', 'service', 'studio')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  storage_path TEXT,
  fallback_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Add column if table already existed without it
ALTER TABLE public.site_images
  ADD COLUMN IF NOT EXISTS fallback_path TEXT;

CREATE INDEX IF NOT EXISTS idx_site_images_category ON public.site_images(category);
CREATE INDEX IF NOT EXISTS idx_site_images_sort ON public.site_images(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_site_images_active ON public.site_images(is_active) WHERE is_active = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.site_images_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_images_updated_at ON public.site_images;
CREATE TRIGGER trg_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.site_images_set_updated_at();

-- ----- RLS (anon = Vercel visitors, authenticated = admin upload) -----
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active site images" ON public.site_images;
DROP POLICY IF EXISTS "Admins manage site images" ON public.site_images;
DROP POLICY IF EXISTS "Admins insert site images" ON public.site_images;
DROP POLICY IF EXISTS "Admins update site images" ON public.site_images;
DROP POLICY IF EXISTS "Admins delete site images" ON public.site_images;

CREATE POLICY "Public read active site images" ON public.site_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins insert site images" ON public.site_images
  FOR INSERT TO authenticated
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins update site images" ON public.site_images
  FOR UPDATE TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins delete site images" ON public.site_images
  FOR DELETE TO authenticated
  USING (public.is_user_admin(auth.uid()));

GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

-- ----- Seed: every image in /images (public fallback_path; anon can SELECT) -----
INSERT INTO public.site_images (slug, category, title, subtitle, description, fallback_path, sort_order) VALUES
  ('team_ronie', 'team', 'Ronie Manaongsong', 'CEO & Founder',
   'Ronie leads JJRK Studio with vision and client-focused leadership.', 'images/Rovick Polinar.png', 1),
  ('team_kim', 'team', 'Kim Duenas', 'Lead Photographer',
   'Kim captures authentic moments with sharp composition and natural light.', 'images/Christian Kirt Basog.jpg', 2),
  ('team_drowmar', 'team', 'Drowmar Vincullado', 'Lead Videographer',
   'Drowmar creates cinematic stories for weddings and events.', 'images/Jhon Vaneth Mejos.jpg', 3),
  ('team_franzen', 'team', 'Franzen Libradilla', 'Media & Web Specialist',
   'Franzen manages the studio website and digital experience.', 'images/Jason S. Salim.jpg', 4),
  ('team_dec', 'team', 'Dec Bucong', 'Senior Photo & Video Editor',
   'Dec delivers polished photos and videos through expert editing.', 'images/Video Editing.webp', 5),
  ('product_wedding_basic', 'product', 'Wedding Package Basic', 'Wedding Packages',
   'Essential photo & video coverage for your wedding day.', 'images/wedding.jpg', 10),
  ('product_wedding_premium', 'product', 'Wedding Package Premium', 'Wedding Packages',
   'Comprehensive photo & video coverage with premium features.', 'images/family portraits.png', 11),
  ('product_event_standard', 'product', 'Event Coverage Standard', 'Event Packages',
   'High-quality photography & videography for special occasions.', 'images/Event Coverage Standard.jpg', 20),
  ('product_event_premium', 'product', 'Event Coverage Premium', 'Event Packages',
   'Premium event coverage with extended hours and multiple cameras.', 'images/Event Coverage Premium.avif', 21),
  ('product_photobooth_basic', 'product', 'Photo Booth Basic', 'Photo Booth Rental',
   'Fun and interactive photo booth setup for your parties.', 'images/Photo Booth.jpg', 30),
  ('product_photobooth_deluxe', 'product', 'Photo Booth Deluxe', 'Photo Booth Rental',
   'Premium photo booth with props and custom backgrounds.', 'images/Photo Booth Deluxe.jpg', 31),
  ('service_wedding', 'service', 'Wedding Photography', 'Services',
   'Professional wedding photography services.', 'images/wedding.jpg', 40),
  ('service_event', 'service', 'Event Videography', NULL,
   'Professional videography for celebrations.', 'images/Event Videography.png', 41),
  ('service_photobooth', 'service', 'Photo Booth Rental', NULL,
   'Photo booth rental for events.', 'images/Photo Booth.jpg', 42),
  ('service_portraits', 'service', 'Studio Portraits', NULL,
   'Portrait sessions in studio or on location.', 'images/family portraits.png', 43),
  ('service_editing', 'service', 'Video Editing', NULL,
   'Professional video editing and color grading.', 'images/Video Editing.webp', 44),
  ('media_event', 'studio', 'Event Highlight', NULL,
   'Event photography sample.', 'images/event.jpg', 45),
  ('studio_main', 'studio', 'JJRK Studio', NULL,
   'Our studio facility.', 'images/jjrk.png', 50),
  ('media_camera', 'studio', 'Camera Background', NULL,
   'Login and register page background.', 'images/camera.jpg', 51)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  fallback_path = EXCLUDED.fallback_path,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = TIMEZONE('utc', NOW());

-- ----- Storage bucket (public CDN URLs for uploaded photos) -----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jjrk-images',
  'jjrk-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read jjr images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload jjr images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update jjr images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete jjr images" ON storage.objects;

CREATE POLICY "Public read jjr images storage" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'jjrk-images');

CREATE POLICY "Admin upload jjr images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admin update jjr images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()))
  WITH CHECK (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admin delete jjr images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()));

-- ----- Verify -----
SELECT slug, category, fallback_path, image_url IS NOT NULL AS has_cloud_url
FROM public.site_images
ORDER BY sort_order;
