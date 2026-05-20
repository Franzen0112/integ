/**
 * Navigation Authentication Handler
 * Public pages (dashboard, etc.) stay as guests until the user submits Login.
 * Logout clears both sessionStorage and the Supabase session in localStorage.
 */

function isUserLoggedIn() {
  return sessionStorage.getItem('userLoggedIn') === 'true' ||
         sessionStorage.getItem('adminLoggedIn') === 'true';
}

function clearLocalAuthFlags() {
  sessionStorage.removeItem('userLoggedIn');
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userEmail');
}

function loadScriptOnce(src) {
  return new Promise(function(resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) {
      resolve();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = function() { resolve(); };
    s.onerror = function() { reject(new Error('Failed to load ' + src)); };
    document.head.appendChild(s);
  });
}

async function signOutSupabaseSession() {
  if (window.db && window.db.logoutUser) {
    await window.db.logoutUser();
    return;
  }
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    var configPath = 'supabase-config.js';
    if (window.location.pathname.indexOf('/auth/') !== -1) {
      configPath = '../supabase-config.js';
    }
    await loadScriptOnce(configPath);
    if (typeof window.waitForSupabase === 'function') {
      await window.waitForSupabase();
    } else if (typeof window.initializeSupabaseClient === 'function') {
      window.initializeSupabaseClient();
    }
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
  } catch (err) {
    console.warn('Supabase sign-out:', err.message || err);
  }
}

function updateNavigationButtons() {
  var authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) {
    return;
  }

  if (isUserLoggedIn()) {
    authButtons.innerHTML =
      '<a href="#" class="btn-logout" onclick="handleLogout(event)">LOGOUT</a>';
  } else {
    authButtons.innerHTML =
      '<a href="login.html" class="btn-login">LOGIN</a>' +
      '<a href="register.html" class="btn-signup">SIGNUP</a>';
  }
}

async function handleLogout(event) {
  if (event) {
    event.preventDefault();
  }

  await signOutSupabaseSession();
  clearLocalAuthFlags();
  window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', function() {
  updateNavigationButtons();
});

window.addEventListener('storage', function(e) {
  if (e.key === 'userLoggedIn' || e.key === 'adminLoggedIn') {
    updateNavigationButtons();
  }
});
