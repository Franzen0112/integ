-- Run if you already ran images-schema-vercel.sql before — adds missing public image rows
INSERT INTO public.site_images (slug, category, title, subtitle, description, fallback_path, sort_order) VALUES
  ('service_portraits', 'service', 'Studio Portraits', NULL, 'Portrait sessions.', 'images/family portraits.png', 43),
  ('service_editing', 'service', 'Video Editing', NULL, 'Video editing services.', 'images/Video Editing.webp', 44),
  ('media_event', 'studio', 'Event Highlight', NULL, 'Event sample.', 'images/event.jpg', 45),
  ('media_camera', 'studio', 'Camera Background', NULL, 'Login background.', 'images/camera.jpg', 51)
ON CONFLICT (slug) DO UPDATE SET
  fallback_path = EXCLUDED.fallback_path,
  is_active = TRUE,
  updated_at = TIMEZONE('utc', NOW());

UPDATE public.site_images SET fallback_path = 'images/Rovick Polinar.png' WHERE slug = 'team_ronie' AND fallback_path IS NULL;
UPDATE public.site_images SET fallback_path = 'images/Christian Kirt Basog.jpg' WHERE slug = 'team_kim' AND fallback_path IS NULL;
UPDATE public.site_images SET fallback_path = 'images/Jhon Vaneth Mejos.jpg' WHERE slug = 'team_drowmar' AND fallback_path IS NULL;
UPDATE public.site_images SET fallback_path = 'images/Jason S. Salim.jpg' WHERE slug = 'team_franzen' AND fallback_path IS NULL;
UPDATE public.site_images SET fallback_path = 'images/Video Editing.webp' WHERE slug = 'team_dec' AND fallback_path IS NULL;

SELECT slug, fallback_path FROM public.site_images ORDER BY sort_order;
