/**
 * Shared auth helpers for login & register pages
 */
(function() {
  'use strict';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  }

  async function ensureAuthReady() {
    if (typeof window.waitForSupabase === 'function') {
      await window.waitForSupabase();
    } else if (typeof window.initializeSupabaseClient === 'function') {
      window.initializeSupabaseClient();
    }
    if (!window.supabaseClient || !window.db) {
      throw new Error('Database not ready. Refresh the page (Ctrl+F5).');
    }
  }

  function finishLoggedIn(user, emailFallback) {
    sessionStorage.setItem('userId', user.id);
    sessionStorage.setItem('userEmail', user.email || emailFallback || '');
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.removeItem('adminLoggedIn');
  }

  async function redirectAfterAuth(user, emailFallback) {
    finishLoggedIn(user, emailFallback);
    var isAdmin = await window.db.isAdmin(user.id);
    if (isAdmin) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.removeItem('userLoggedIn');
      window.location.replace('admin_dashboard.html');
    } else {
      window.location.replace('dashboard.html');
    }
  }

  async function tryRestoreSession() {
    try {
      await ensureAuthReady();
      var result = await window.db.getCurrentUser();
      if (result.user) {
        await redirectAfterAuth(result.user, result.user.email);
        return true;
      }
    } catch (e) {
      console.warn('Session restore skipped:', e.message);
    }
    return false;
  }

  if (typeof window !== 'undefined') {
    window.authCommon = {
      isValidEmail: isValidEmail,
      ensureAuthReady: ensureAuthReady,
      finishLoggedIn: finishLoggedIn,
      redirectAfterAuth: redirectAfterAuth,
      tryRestoreSession: tryRestoreSession
    };
  }
})();
