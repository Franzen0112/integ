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

UPDATE public.site_images SET fallback_path = 'images/Ronie Manaongsong.jpg' WHERE slug = 'team_ronie';
UPDATE public.site_images SET fallback_path = 'images/Kim Duenas.jpg' WHERE slug = 'team_kim';
UPDATE public.site_images SET fallback_path = 'images/Drowmar Vinculado.jpg' WHERE slug = 'team_drowmar';
UPDATE public.site_images SET fallback_path = 'images/Franzen Libradilla.jpg' WHERE slug = 'team_franzen';
UPDATE public.site_images SET fallback_path = 'images/Dec Rainiel Bucong.jpg' WHERE slug = 'team_dec';

SELECT slug, fallback_path FROM public.site_images ORDER BY sort_order;
