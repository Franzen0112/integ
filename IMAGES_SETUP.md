# Site Images (Local extract + optional Database)

## 0. Extract photos (required for dashboard / home)

Zip file should be in project root: `images-20260520T124118Z-3-001.zip`

```powershell
cd c:\Users\FRANZEN\Downloads\integ
node scripts/extract-images.js
```

This creates **`images/`** with `wedding.jpg`, `jjrk.png`, etc. Pages use these paths first; database upload is optional.

## 1. Run SQL in Supabase (Vercel + admin upload)

Open **SQL Editor** → New query → paste **`images-schema-vercel.sql`** → Run

(After `supabase-schema.sql` + `fix-rls-policies.sql`. Safe to re-run.)

This creates `site_images`, Storage bucket `jjrk-images`, and `fallback_path` for Vercel static files.

This creates:

- Table `site_images` (team, products, services, studio)
- Storage bucket `jjrk-images` (public read)
- Seed rows for all image slots

## 2. Admin upload

1. Login as **admin** (`role = 1` in `users` table)
2. Open **Admin Dashboard** → section **Site Images**
3. Click **Change photo** on any card — file uploads and **saves automatically** (Storage URL + database row)

## 3. Public pages (load from database)

| Page | What updates |
|------|----------------|
| `about_us.html` | Team grid + studio photos |
| `product.html` | Product offer images |
| `services.html` | Main service images |

Until you upload, pages use fallback images in `images/` folder or initials (team).

## Troubleshooting

- **Upload failed** — Confirm admin login (Supabase session), run `images-schema.sql`, check Storage bucket `jjrk-images` exists.
- **Photos not showing on site** — Hard refresh (`Ctrl+F5`); check `site_images.image_url` in Supabase Table Editor.
