/**
 * Admin dashboard: real-time inbox, notifications, reply
 */
(function() {
  'use strict';

  var selectedConversationId = null;
  var conversationsCache = [];
  var notificationsCache = [];

  function el(id) { return document.getElementById(id); }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  async function refreshNotificationBadge() {
    if (!window.messaging) return;
    var res = await window.messaging.getUnreadNotificationCount();
    var badge = el('adminNotifBadge');
    var n = res.count || 0;
    if (badge) {
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.style.display = n > 0 ? 'flex' : 'none';
    }
  }

  function renderNotificationsList() {
    var list = el('adminNotifList');
    if (!list) return;

    if (!notificationsCache.length) {
      list.innerHTML = '<p class="inbox-empty">No notifications yet.</p>';
      return;
    }

    list.innerHTML = notificationsCache.map(function(n) {
      return (
        '<div class="notif-item ' + (n.read ? '' : 'unread') + '" data-id="' + n.id + '" data-ref="' + escapeHtml(n.reference_id || '') + '" data-type="' + escapeHtml(n.type) + '">' +
          '<div class="notif-title">' + escapeHtml(n.title) + '</div>' +
          '<div class="notif-body">' + escapeHtml(n.body) + '</div>' +
          '<div class="notif-time">' + window.messaging.formatTime(n.created_at) + '</div>' +
        '</div>'
      );
    }).join('');

    list.querySelectorAll('.notif-item').forEach(function(item) {
      item.addEventListener('click', async function() {
        var id = item.getAttribute('data-id');
        var ref = item.getAttribute('data-ref');
        var type = item.getAttribute('data-type');
        await window.messaging.markNotificationRead(id);
        item.classList.remove('unread');
        await loadNotifications();

        if ((type === 'message' || type === 'reply') && ref) {
          selectConversation(ref);
          el('adminNotifPanel').classList.remove('open');
        } else if (type === 'booking') {
          document.querySelector('.bookings-section').scrollIntoView({ behavior: 'smooth' });
          el('adminNotifPanel').classList.remove('open');
        }
      });
    });
  }

  async function loadNotifications() {
    if (!window.messaging) return;
    var res = await window.messaging.getNotifications();
    notificationsCache = res.data || [];
    renderNotificationsList();
    await refreshNotificationBadge();
  }

  function renderConversationList() {
    var list = el('adminConvList');
    if (!list) return;

    if (!conversationsCache.length) {
      list.innerHTML = '<p class="inbox-empty">No conversations. Messages from Contact Us appear here.</p>';
      return;
    }

    list.innerHTML = conversationsCache.map(function(c) {
      var active = c.id === selectedConversationId ? ' active' : '';
      var unread = c.admin_unread > 0 ? ' unread' : '';
      return (
        '<button type="button" class="conv-item' + active + unread + '" data-id="' + c.id + '">' +
          '<span class="conv-subject">' + escapeHtml(c.subject) + '</span>' +
          '<span class="conv-meta">' + escapeHtml(c.visitor_name) + ' · ' + escapeHtml(c.visitor_email) + '</span>' +
          '<span class="conv-time">' + window.messaging.formatTime(c.last_message_at) + '</span>' +
          (c.admin_unread > 0 ? '<span class="conv-badge">' + c.admin_unread + '</span>' : '') +
        '</button>'
      );
    }).join('');

    list.querySelectorAll('.conv-item').forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectConversation(btn.getAttribute('data-id'));
      });
    });
  }

  function renderChatMessages(messages) {
    var box = el('adminChatMessages');
    if (!box) return;

    if (!messages || !messages.length) {
      box.innerHTML = '<p class="inbox-empty">No messages in this thread.</p>';
      return;
    }

    box.innerHTML = messages.map(function(m) {
      var isAdmin = m.sender_type === 'admin';
      var rowClass = isAdmin ? 'admin' : 'visitor';
      var meta = isAdmin
        ? escapeHtml(m.sender_name) + ' · ' + window.messaging.formatTime(m.created_at)
        : escapeHtml(m.sender_name) + ' · ' + window.messaging.formatTime(m.created_at);
      var badge = isAdmin ? '' : '<span class="user-badge"><i class="fa-solid fa-user"></i> Customer message</span>';
      return (
        '<div class="chat-row ' + rowClass + '">' +
          '<div class="chat-bubble ' + rowClass + '">' +
            badge +
            '<div class="chat-meta">' + meta + '</div>' +
            '<div class="chat-body">' + escapeHtml(m.body) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    box.scrollTop = box.scrollHeight;
  }

  async function selectConversation(id) {
    selectedConversationId = id;
    renderConversationList();

    var conv = conversationsCache.find(function(c) { return c.id === id; });
    var header = el('adminChatHeader');
    if (header && conv) {
      header.innerHTML = '<strong>' + escapeHtml(conv.subject) + '</strong><br>' +
        '<span>' + escapeHtml(conv.visitor_name) + ' &lt;' + escapeHtml(conv.visitor_email) + '&gt;</span>';
    }

    await window.messaging.markConversationRead(id);
    var res = await window.messaging.getConversationMessages(id);
    renderChatMessages(res.data || []);

    var idx = conversationsCache.findIndex(function(c) { return c.id === id; });
    if (idx >= 0) conversationsCache[idx].admin_unread = 0;
    renderConversationList();
  }

  async function loadConversations() {
    if (!window.messaging) return;
    var res = await window.messaging.getConversations();
    if (res.error) {
      console.error(res.error);
      return;
    }
    conversationsCache = res.data || [];
    renderConversationList();

    if (selectedConversationId) {
      var still = conversationsCache.some(function(c) { return c.id === selectedConversationId; });
      if (still) await selectConversation(selectedConversationId);
    } else if (conversationsCache.length) {
      await selectConversation(conversationsCache[0].id);
    }
  }

  async function sendAdminReply() {
    var input = el('adminReplyInput');
    var body = (input && input.value || '').trim();
    if (!body || !selectedConversationId) {
      alert('Select a conversation and type a reply.');
      return;
    }

    var res = await window.messaging.adminSendReply(
      selectedConversationId,
      body,
      'JJRK Admin'
    );

    if (res.error) {
      alert('Failed to send: ' + res.error.message);
      return;
    }

    input.value = '';
    await selectConversation(selectedConversationId);
  }

  function setupAdminMessagingUI() {
    var bell = el('adminNotifBell');
    var panel = el('adminNotifPanel');
    if (bell && panel) {
      bell.addEventListener('click', function() {
        panel.classList.toggle('open');
      });
    }

    var sendBtn = el('adminReplySend');
    if (sendBtn) sendBtn.addEventListener('click', sendAdminReply);

    var replyInput = el('adminReplyInput');
    if (replyInput) {
      replyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendAdminReply();
        }
      });
    }

    document.addEventListener('click', function(e) {
      if (panel && panel.classList.contains('open') &&
          !panel.contains(e.target) && bell && !bell.contains(e.target)) {
        panel.classList.remove('open');
      }
    });
  }

  async function initAdminMessaging() {
    if (!window.messaging) {
      console.warn('messaging.js not loaded');
      return;
    }

    window.messaging.requestNotificationPermission();
    setupAdminMessagingUI();
    await loadNotifications();
    await loadConversations();

    window.messaging.subscribeAdminRealtime({
      onNotification: async function() {
        await loadNotifications();
        if (typeof window.loadBookings === 'function') await window.loadBookings();
      },
      onMessage: async function(msg) {
        await loadConversations();
        if (msg.conversation_id === selectedConversationId) {
          await selectConversation(selectedConversationId);
        }
      },
      onBooking: async function() {
        if (typeof window.loadBookings === 'function') await window.loadBookings();
        await loadNotifications();
      },
      onConversation: async function() {
        await loadConversations();
      }
    });
  }

  window.adminMessaging = {
    init: initAdminMessaging,
    loadConversations: loadConversations,
    loadNotifications: loadNotifications,
    refreshNotificationBadge: refreshNotificationBadge
  };
})();
