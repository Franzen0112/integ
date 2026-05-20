-- JJRK Studio — site images (team, products, services) + Supabase Storage
-- Run in Supabase SQL Editor AFTER supabase-schema.sql and fix-rls-policies.sql

-- ===== TABLE =====
CREATE TABLE IF NOT EXISTS public.site_images (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('team', 'product', 'service', 'studio')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  storage_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_images_category ON public.site_images(category);
CREATE INDEX IF NOT EXISTS idx_site_images_sort ON public.site_images(category, sort_order);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active site images" ON public.site_images;
DROP POLICY IF EXISTS "Admins manage site images" ON public.site_images;

CREATE POLICY "Public read active site images" ON public.site_images
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins manage site images" ON public.site_images
  FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

-- ===== SEED (text stays in DB; upload photos in Admin → Site Images) =====
INSERT INTO public.site_images (slug, category, title, subtitle, description, sort_order) VALUES
  ('team_ronie', 'team', 'Ronie Manaongsong', 'CEO & Founder',
   'Ronie leads JJRK Studio with a clear vision for quality and client satisfaction.', 1),
  ('team_kim', 'team', 'Kim Duenas', 'Lead Photographer',
   'Kim specializes in capturing authentic moments with sharp composition and natural lighting.', 2),
  ('team_drowmar', 'team', 'Drowmar Vincullado', 'Lead Videographer',
   'Drowmar creates cinematic video content with smooth motion and strong storytelling.', 3),
  ('team_franzen', 'team', 'Franzen Libradilla', 'Media & Web Specialist',
   'Franzen supports the studio''s digital side—website, booking, and media systems.', 4),
  ('team_dec', 'team', 'Dec Bucong', 'Senior Photo & Video Editor',
   'Dec brings photos and footage to life through color grading and precise cuts.', 5),
  ('product_wedding_basic', 'product', 'Wedding Package Basic', 'Wedding Packages',
   'Essential photo & video coverage for your wedding day.', 10),
  ('product_wedding_premium', 'product', 'Wedding Package Premium', 'Wedding Packages',
   'Comprehensive photo & video coverage with premium features.', 11),
  ('product_event_standard', 'product', 'Event Coverage Standard', 'Event Packages',
   'High-quality photography & videography for special occasions.', 20),
  ('product_event_premium', 'product', 'Event Coverage Premium', 'Event Packages',
   'Premium event coverage with extended hours and multiple cameras.', 21),
  ('product_photobooth_basic', 'product', 'Photo Booth Basic', 'Photo Booth Rental',
   'Fun and interactive photo booth setup for your parties.', 30),
  ('product_photobooth_deluxe', 'product', 'Photo Booth Deluxe', 'Photo Booth Rental',
   'Premium photo booth with props and custom backgrounds.', 31),
  ('service_wedding', 'service', 'Wedding Photography', NULL,
   'Professional wedding photography services.', 40),
  ('service_event', 'service', 'Event Videography', NULL,
   'Professional videography for celebrations.', 41),
  ('service_photobooth', 'service', 'Photo Booth Rental', NULL,
   'Photo booth rental for events.', 42),
  ('studio_main', 'studio', 'JJRK Studio', NULL,
   'Our studio facility.', 50)
ON CONFLICT (slug) DO NOTHING;

-- ===== STORAGE BUCKET =====
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
  USING (bucket_id = 'jjrk-images');

CREATE POLICY "Admin upload jjr images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'jjrk-images'
    AND public.is_user_admin(auth.uid())
  );

CREATE POLICY "Admin update jjr images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()))
  WITH CHECK (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()));

CREATE POLICY "Admin delete jjr images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'jjrk-images' AND public.is_user_admin(auth.uid()));
