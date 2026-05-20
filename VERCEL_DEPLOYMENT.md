# Vercel Deployment Notes

**Full step-by-step setup:** see **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** (Supabase keys + Vercel deploy + redirect URLs).

## Important: 404 Error Fix

Kung makakita ka ug **404: NOT_FOUND** error sa Vercel, kasagaran tungod kay:

### 1. Wala pa na-run ang SQL Schema ⚠️

Kinahanglan mo una mag-create sa database tables sa Supabase:

1. Adto sa: https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new
2. Copy ang tanan sulod sa `supabase-schema.sql`
3. Paste ug i-click ang **Run**
4. Check nga na-create ang mga tables:
   - `users`
   - `bookings`
   - `messages`

### 2. I-verify ang Script Order

Siguruha nga ang scripts ma-load sa tama nga order sa tanan HTML files:

```html
<!-- 1. Una - Supabase Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Sunod - Configuration -->
<script src="supabase-config.js"></script>

<!-- 3. Katapusan - Database Functions -->
<script src="db.js"></script>
```

### 3. Browser Console Check

Open ang browser console (F12) ug tan-awa kung dunay errors:
- Kung makakita ka ug "Supabase client not initialized" → Ang script order sayop
- Kung makakita ka ug "relation does not exist" → Wala pa na-run ang SQL schema
- Kung makakita ka ug 404 → Ang table wala pa exist

### 4. Test sa Local First

Siguruha nga nag-work ang application sa local bago i-deploy:
1. Open ang HTML files sa browser
2. Open ang Developer Console (F12)
3. Test ang registration/login
4. Check kung dunay errors

### 5. Vercel Build Configuration

Kung naggamit ka ug build process, siguruha nga:
- Ang tanan files (supabase-config.js, db.js) na-deploy
- Wala dunay build errors
- Ang file paths tama

### Troubleshooting Checklist

- [ ] Na-run na ang SQL schema sa Supabase?
- [ ] Naka-configure na ang API key sa supabase-config.js?
- [ ] Nag-work ba sa local browser?
- [ ] Naka-check na sa browser console para sa errors?
- [ ] Ang script order tama sa tanan HTML files?

### Quick Test

After deployment, test ang mosunod:
1. Register new user
2. Login
3. Submit booking
4. Submit message
5. Login as admin ug check dashboard

Kung dunay errors, check ang browser console para sa details.

