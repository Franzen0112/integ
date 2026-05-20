-- FIX: Contact form RLS + real-time messaging notifications
-- Run this in Supabase SQL Editor (fixes "row-level security policy for table messages")

-- ===== 1. MESSAGES: allow public to send (anon = website visitors) =====
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
DROP POLICY IF EXISTS "authenticated_insert_messages" ON messages;
DROP POLICY IF EXISTS "Admins can view messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

CREATE POLICY "anon_insert_messages" ON messages
  AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_insert_messages" ON messages
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view messages" ON messages
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update messages" ON messages
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can delete messages" ON messages
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- ===== 2. BOOKINGS: allow public to book =====
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "authenticated_insert_bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings
  AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_insert_bookings" ON bookings
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

-- ===== 3. GRANTS (required for anon key) =====
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON messages TO anon, authenticated;
GRANT INSERT ON bookings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ===== 4. Ensure notify_admin bypasses RLS =====
CREATE OR REPLACE FUNCTION public.notify_admin(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, body, reference_id)
  VALUES (p_type, p_title, p_body, p_reference_id);
END;
$$;

-- ===== 5. Contact thread RPC (bypasses RLS for full flow) =====
CREATE OR REPLACE FUNCTION public.create_contact_thread(
  p_name TEXT,
  p_email TEXT,
  p_subject TEXT,
  p_body TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_msg_id BIGINT;
BEGIN
  INSERT INTO messages (name, email, subject, message, read)
  VALUES (p_name, trim(lower(p_email)), p_subject, p_body, false)
  RETURNING id INTO v_msg_id;

  SELECT * INTO v_conv FROM conversations
  WHERE legacy_message_id = v_msg_id
  LIMIT 1;

  IF v_conv.id IS NULL THEN
    INSERT INTO conversations (visitor_email, visitor_name, subject, source, legacy_message_id, admin_unread)
    VALUES (trim(lower(p_email)), p_name, p_subject, 'contact', v_msg_id, 1)
    RETURNING * INTO v_conv;

    INSERT INTO conversation_messages (conversation_id, sender_type, sender_name, body)
    VALUES (v_conv.id, 'visitor', p_name, p_body);

    PERFORM public.notify_admin(
      'message',
      'New message from ' || p_name,
      p_subject || ': ' || LEFT(p_body, 120),
      v_conv.id::text
    );
  END IF;

  RETURN json_build_object(
    'conversation_id', v_conv.id,
    'access_token', v_conv.access_token,
    'message_id', v_msg_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_contact_thread(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ===== 6. Messaging tables RLS (if messaging-schema already run) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins manage conversations" ON conversations;
    CREATE POLICY "Admins manage conversations" ON conversations
      AS PERMISSIVE FOR ALL TO authenticated
      USING (public.auth_is_admin())
      WITH CHECK (public.auth_is_admin());

    DROP POLICY IF EXISTS "Admins manage conv messages" ON conversation_messages;
    CREATE POLICY "Admins manage conv messages" ON conversation_messages
      AS PERMISSIVE FOR ALL TO authenticated
      USING (public.auth_is_admin())
      WITH CHECK (public.auth_is_admin());

    DROP POLICY IF EXISTS "Admins manage notifications" ON admin_notifications;
    CREATE POLICY "Admins manage notifications" ON admin_notifications
      AS PERMISSIVE FOR ALL TO authenticated
      USING (public.auth_is_admin())
      WITH CHECK (public.auth_is_admin());
  END IF;
END $$;

-- Done. Test: send message from Contact Us page.
