/**
 * Real-time messaging + admin notifications (Supabase Realtime)
 */
(function() {
  'use strict';

  function getSupabase() {
    return window.supabaseClient || null;
  }

  function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  async function createContactThread(name, email, subject, body) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase.rpc('create_contact_thread', {
      p_name: name,
      p_email: email.trim().toLowerCase(),
      p_subject: subject,
      p_body: body
    });

    if (error) return { data: null, error };
    return { data: data, error: null };
  }

  async function getVisitorThread(conversationId, accessToken) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase.rpc('get_visitor_thread', {
      p_conversation_id: conversationId,
      p_access_token: accessToken
    });
    return { data, error };
  }

  async function visitorSendMessage(conversationId, accessToken, body) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase.rpc('visitor_send_message', {
      p_conversation_id: conversationId,
      p_access_token: accessToken,
      p_body: body
    });
    return { data, error };
  }

  async function getConversations() {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    return { data, error };
  }

  async function getConversationMessages(conversationId) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  async function adminSendReply(conversationId, body, adminName) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: 'admin',
        sender_name: adminName || 'JJRK Admin',
        body: body
      }])
      .select()
      .single();

    if (error) return { data: null, error };

    await supabase
      .from('conversations')
      .update({
        admin_unread: 0,
        visitor_unread: 1,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return { data, error: null };
  }

  async function markConversationRead(conversationId) {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Database not ready') };

    const { error } = await supabase
      .from('conversations')
      .update({ admin_unread: 0 })
      .eq('id', conversationId);

    return { error };
  }

  async function getNotifications() {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return { data, error };
  }

  async function getUnreadNotificationCount() {
    const supabase = getSupabase();
    if (!supabase) return { count: 0 };

    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    return { count: error ? 0 : (count || 0), error };
  }

  async function markNotificationRead(id) {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Database not ready') };

    return await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id);
  }

  async function markAllNotificationsRead() {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Database not ready') };

    return await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('read', false);
  }

  function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function showBrowserNotification(title, body) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body: body, icon: '/favicon.ico' });
    } catch (e) { /* ignore */ }
  }

  var adminChannel = null;

  function subscribeAdminRealtime(handlers) {
    const supabase = getSupabase();
    if (!supabase) return null;

    handlers = handlers || {};

    if (adminChannel) {
      supabase.removeChannel(adminChannel);
    }

    adminChannel = supabase.channel('jjrk-admin-realtime');

    adminChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, function(payload) {
        if (handlers.onNotification) handlers.onNotification(payload.new);
        showBrowserNotification(payload.new.title || 'JJRK Studio', payload.new.body || '');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, function(payload) {
        if (handlers.onMessage) handlers.onMessage(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, function(payload) {
        if (handlers.onConversation) handlers.onConversation(payload.new);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, function(payload) {
        if (handlers.onBooking) handlers.onBooking(payload.new);
        showBrowserNotification('New booking', (payload.new.service || '') + ' — ' + (payload.new.client || ''));
      })
      .subscribe();

    return adminChannel;
  }

  function subscribeVisitorRealtime(conversationId, onNewMessage) {
    const supabase = getSupabase();
    if (!supabase || !conversationId) return null;

    var channel = supabase.channel('visitor-' + conversationId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: 'conversation_id=eq.' + conversationId
      }, function(payload) {
        if (onNewMessage) onNewMessage(payload.new);
      })
      .subscribe();

    return channel;
  }

  function unsubscribeAdmin() {
    const supabase = getSupabase();
    if (supabase && adminChannel) {
      supabase.removeChannel(adminChannel);
      adminChannel = null;
    }
  }

  window.messaging = {
    formatTime: formatTime,
    createContactThread: createContactThread,
    getVisitorThread: getVisitorThread,
    visitorSendMessage: visitorSendMessage,
    getConversations: getConversations,
    getConversationMessages: getConversationMessages,
    adminSendReply: adminSendReply,
    markConversationRead: markConversationRead,
    getNotifications: getNotifications,
    getUnreadNotificationCount: getUnreadNotificationCount,
    markNotificationRead: markNotificationRead,
    markAllNotificationsRead: markAllNotificationsRead,
    requestNotificationPermission: requestNotificationPermission,
    showBrowserNotification: showBrowserNotification,
    subscribeAdminRealtime: subscribeAdminRealtime,
    subscribeVisitorRealtime: subscribeVisitorRealtime,
    unsubscribeAdmin: unsubscribeAdmin
  };
})();
