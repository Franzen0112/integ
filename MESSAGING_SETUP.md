# Real-time Messaging Setup

## 1. Run SQL in Supabase

Open [SQL Editor](https://supabase.com/dashboard/project/eeagyngzbzcpqxptnqvy/sql/new) and run:

1. `supabase-schema.sql` (if not done)
2. `fix-rls-policies.sql`
3. **`messaging-schema.sql`** ← required for inbox + notifications

## 2. Enable Realtime

Supabase → **Database** → **Replication** (or Publications):

Enable realtime for:

- `conversations`
- `conversation_messages`
- `admin_notifications`
- `bookings`

Or run the `ALTER PUBLICATION` blocks at the bottom of `messaging-schema.sql`.

## 3. How it works

| Action | Result |
|--------|--------|
| Visitor sends Contact Us form | Creates thread + notifies admin (bell) |
| New booking on Products page | Admin notification + browser alert |
| Admin replies in Live Inbox | Visitor sees reply on Contact page (live) |
| Admin opens dashboard | Bell shows unread count |

## 4. Admin usage

1. Login as admin (`role = 1` in `users` table)
2. Open **Admin Dashboard**
3. Click **bell icon** for notifications
4. Use **Live Inbox** to select a conversation and **Send** replies

## 5. Visitor usage

1. Submit Contact Us form
2. **Chat box** opens below the form
3. Admin replies appear automatically (poll + realtime)

## 6. Deploy

Push to GitHub → Vercel redeploy. Files: `messaging.js`, `admin-messaging.js`, updated HTML.

## Troubleshooting

- **Inbox empty** → Run `messaging-schema.sql`
- **No realtime** → Enable replication tables + refresh admin page
- **Cannot reply** → Confirm logged-in user has `role = 1`
- **Visitor chat empty** → Run SQL + send new test message from Contact Us
