// Supabase Configuration
// Project ID: eeagyngzbzcpqxptnqvy

const SUPABASE_URL = 'https://eeagyngzbzcpqxptnqvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWd5bmd6YnpjcHF4cHRucXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzk1MTUsImV4cCI6MjA4Mjg1NTUxNX0.PY_4TUkQoDvwhUKyYl2lIcCvfA6mgCStp9h657IMq0g';

// Initialize Supabase client
// This will be executed after the Supabase library loads from CDN
var supabaseClient = null;

function initializeSupabaseClient() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if Supabase library is available
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabaseClient;
      return true;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
  return false;
}

// Try to initialize immediately
if (!initializeSupabaseClient()) {
  // If not ready, wait a bit and retry
  var retries = 0;
  var maxRetries = 20; // Try for 2 seconds max
  
  var retryInterval = setInterval(function() {
    if (initializeSupabaseClient() || retries >= maxRetries) {
      clearInterval(retryInterval);
      if (retries >= maxRetries && !supabaseClient) {
        console.error('Failed to initialize Supabase client after multiple attempts. Make sure the Supabase library is loaded.');
      }
    }
    retries++;
  }, 100);
}

// Also try on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseClient);
  } else {
    initializeSupabaseClient();
  }
}
