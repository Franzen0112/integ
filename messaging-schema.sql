-- Real-time messaging + admin notifications for JJRK Studio
-- Run in Supabase SQL Editor AFTER supabase-schema.sql and fix-rls-policies.sql

-- ===== CONVERSATIONS =====
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_email TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'General inquiry',
  source TEXT NOT NULL DEFAULT 'contact' CHECK (source IN ('contact', 'booking')),
  legacy_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  admin_unread INTEGER NOT NULL DEFAULT 0,
  visitor_unread INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_conversations_email ON conversations(visitor_email);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- ===== THREAD MESSAGES =====
CREATE TABLE IF NOT EXISTS conversation_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin')),
  sender_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON conversation_messages(conversation_id, created_at);

-- ===== ADMIN NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('message', 'booking', 'reply')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  reference_id TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_unread ON admin_notifications(read, created_at DESC);

-- ===== HELPER: is admin =====
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_user_admin(auth.uid());
$$;

-- ===== NOTIFY ADMIN =====
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

-- ===== SYNC OLD MESSAGES TABLE → CONVERSATION =====
CREATE OR REPLACE FUNCTION public.sync_message_to_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE visitor_email = NEW.email
    AND subject = NEW.subject
    AND source = 'contact'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (visitor_email, visitor_name, subject, source, legacy_message_id, admin_unread, visitor_unread)
    VALUES (NEW.email, NEW.name, NEW.subject, 'contact', NEW.id, 1, 0)
    RETURNING id INTO v_conv_id;
  ELSE
    UPDATE conversations
    SET legacy_message_id = NEW.id,
        admin_unread = admin_unread + 1,
        last_message_at = NOW()
    WHERE id = v_conv_id;
  END IF;

  INSERT INTO conversation_messages (conversation_id, sender_type, sender_name, body)
  VALUES (v_conv_id, 'visitor', NEW.name, NEW.message);

  PERFORM public.notify_admin(
    'message',
    'New message from ' || NEW.name,
    NEW.subject || ': ' || LEFT(NEW.message, 120),
    v_conv_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_message_conversation ON messages;
CREATE TRIGGER trg_sync_message_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_message_to_conversation();

-- ===== BOOKING → ADMIN NOTIFICATION =====
CREATE OR REPLACE FUNCTION public.notify_admin_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admin(
    'booking',
    'New booking: ' || NEW.service,
    NEW.client || ' · ' || NEW.email || ' · ' || COALESCE(NEW.date::text, '') || ' ' || COALESCE(NEW.time, ''),
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_booking ON bookings;
CREATE TRIGGER trg_notify_booking
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_booking();

-- ===== RPC: Create contact thread (contact form) =====
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
  VALUES (p_name, p_email, p_subject, p_body, false)
  RETURNING id INTO v_msg_id;

  SELECT * INTO v_conv FROM conversations
  WHERE legacy_message_id = v_msg_id LIMIT 1;

  RETURN json_build_object(
    'conversation_id', v_conv.id,
    'access_token', v_conv.access_token,
    'message_id', v_msg_id
  );
END;
$$;

-- ===== RPC: Visitor read thread =====
CREATE OR REPLACE FUNCTION public.get_visitor_thread(
  p_conversation_id UUID,
  p_access_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_messages JSON;
BEGIN
  SELECT * INTO v_conv FROM conversations
  WHERE id = p_conversation_id AND access_token = p_access_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid conversation or access token';
  END IF;

  UPDATE conversations SET visitor_unread = 0 WHERE id = v_conv.id;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'sender_type', m.sender_type,
      'sender_name', m.sender_name,
      'body', m.body,
      'created_at', m.created_at
    ) ORDER BY m.created_at ASC
  ), '[]'::json) INTO v_messages
  FROM conversation_messages m
  WHERE m.conversation_id = v_conv.id;

  RETURN json_build_object(
    'conversation', json_build_object(
      'id', v_conv.id,
      'subject', v_conv.subject,
      'visitor_name', v_conv.visitor_name,
      'visitor_email', v_conv.visitor_email,
      'status', v_conv.status
    ),
    'messages', v_messages
  );
END;
$$;

-- ===== RPC: Visitor send follow-up =====
CREATE OR REPLACE FUNCTION public.visitor_send_message(
  p_conversation_id UUID,
  p_access_token UUID,
  p_body TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_msg conversation_messages%ROWTYPE;
BEGIN
  SELECT * INTO v_conv FROM conversations
  WHERE id = p_conversation_id AND access_token = p_access_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid conversation or access token';
  END IF;

  INSERT INTO conversation_messages (conversation_id, sender_type, sender_name, body)
  VALUES (v_conv.id, 'visitor', v_conv.visitor_name, p_body)
  RETURNING * INTO v_msg;

  UPDATE conversations
  SET admin_unread = admin_unread + 1,
      last_message_at = NOW()
  WHERE id = v_conv.id;

  PERFORM public.notify_admin(
    'reply',
    'Reply from ' || v_conv.visitor_name,
    LEFT(p_body, 120),
    v_conv.id::text
  );

  RETURN json_build_object('message', row_to_json(v_msg));
END;
$$;

-- ===== RLS =====
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage conversations" ON conversations;
CREATE POLICY "Admins manage conversations" ON conversations
  FOR ALL USING (public.auth_is_admin())
  WITH CHECK (public.auth_is_admin());

DROP POLICY IF EXISTS "Admins manage conv messages" ON conversation_messages;
CREATE POLICY "Admins manage conv messages" ON conversation_messages
  FOR ALL USING (public.auth_is_admin())
  WITH CHECK (public.auth_is_admin());

DROP POLICY IF EXISTS "Admins manage notifications" ON admin_notifications;
CREATE POLICY "Admins manage notifications" ON admin_notifications
  FOR ALL USING (public.auth_is_admin())
  WITH CHECK (public.auth_is_admin());

GRANT EXECUTE ON FUNCTION public.create_contact_thread TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_thread TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_send_message TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admin TO authenticated;

-- ===== REALTIME (enable in Supabase Dashboard if ALTER fails) =====
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
