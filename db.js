// Database Utility Functions for Supabase
// This file contains helper functions for database operations
// Version: 2.0 - Fixed scope issues

(function() {
  'use strict';

  // Get Supabase client dynamically (should be initialized in supabase-config.js)
  function getSupabaseClient() {
    if (typeof window === 'undefined') return null;
    return window.supabaseClient || null;
  }

  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function isEmailNotConfirmedError(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return (
      error.code === 'email_not_confirmed' ||
      msg.includes('email not confirmed') ||
      msg.includes('email_not_confirmed')
    );
  }

  function parseAuthError(error) {
    if (!error) return {};
    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '').toLowerCase();
    const status = error.status || error.statusCode;
    return {
      isRateLimit:
        status === 429 ||
        msg.includes('rate limit') ||
        code.includes('rate_limit') ||
        code === 'over_email_send_rate_limit',
      isAlreadyRegistered:
        msg.includes('already registered') ||
        msg.includes('user already registered') ||
        msg.includes('already been registered') ||
        code === 'user_already_exists',
      isEmailNotConfirmed: isEmailNotConfirmedError(error),
      isInvalidCredentials: msg.includes('invalid login credentials')
    };
  }

  function setAuthUserMessage(error, context) {
    if (!error) return;
    const info = parseAuthError(error);

    if (info.isRateLimit) {
      error.userMessage =
        'Too many signup/verification emails were sent. Your account is likely already created.\n\n' +
        '→ Go to Login and use the same email and password.\n' +
        '→ If login still fails: Supabase Dashboard → Authentication → Users → Confirm email for your account.\n' +
        '→ Or turn OFF "Confirm email" under Authentication → Providers → Email.';
      return;
    }

    if (context === 'register' && info.isAlreadyRegistered) {
      error.userMessage =
        'This email is already registered. Go to the Login page and sign in with your password.';
      return;
    }

    if (info.isEmailNotConfirmed) {
      error.userMessage =
        'Your account exists but email is not verified yet.\n\n' +
        'Do NOT register again. Ask the admin to open Supabase → Authentication → Users → your account → Confirm email.\n' +
        'Or disable "Confirm email" in Authentication → Providers → Email.';
      return;
    }

    if (info.isInvalidCredentials) {
      error.userMessage =
        'Wrong email or password — or your email is not confirmed yet. Try Login; if it still fails, confirm email in Supabase Dashboard.';
      return;
    }

    error.userMessage = error.message || 'Authentication failed.';
  }

  async function signInWithPassword(supabase, email, password) {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });
    if (error) {
      setAuthUserMessage(error, 'login');
    }
    return { data, error };
  }

  // ===== AUTHENTICATION FUNCTIONS =====

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data (fullname, phone)
   * @returns {Promise<Object>} - Registration result
   */
  function isLikelyExistingUserFromSignup(authData) {
    const user = authData && authData.user;
    if (!user) return false;
    const identities = user.identities;
    return !identities || identities.length === 0;
  }

  async function tryLoginAndReturn(supabase, email, password, options) {
    options = options || {};
    const loginResult = await signInWithPassword(supabase, email, password);
    if (!loginResult.error && loginResult.data) {
      return {
        data: loginResult.data,
        error: null,
        viaLogin: true,
        status: 'logged_in'
      };
    }
    const info = parseAuthError(loginResult.error);
    if (info.isEmailNotConfirmed) {
      setAuthUserMessage(loginResult.error, 'register');
      return {
        data: null,
        error: loginResult.error,
        needsEmailConfirm: true,
        status: 'needs_confirm'
      };
    }
    if (options.wantError) {
      setAuthUserMessage(loginResult.error, 'register');
      return { data: null, error: loginResult.error, status: 'error' };
    }
    return null;
  }

  /**
   * Register OR sign in: existing users log in immediately; new emails create an account.
   */
  async function registerUser(email, password, userData = {}) {
    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        const error = new Error('Supabase client not initialized. Make sure supabase-config.js is loaded and Supabase library is available.');
        console.error('Registration failed:', error);
        return { data: null, error };
      }

      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        const error = new Error('Please enter a valid email address (example: name@gmail.com).');
        error.userMessage = error.message;
        return { data: null, error };
      }

      // 1) Existing account with correct password → log in immediately (no signup email)
      const existingSession = await tryLoginAndReturn(supabase, normalizedEmail, password);
      if (existingSession) {
        console.log('Register: existing user logged in');
        return existingSession;
      }

      // 2) New email (login = invalid credentials) → sign up
      console.log('Register: new email, signing up:', normalizedEmail);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          emailRedirectTo: (typeof window.getAuthRedirectUrl === 'function'
            ? window.getAuthRedirectUrl()
            : (window.location.origin + '/auth/callback.html')),
          data: {
            full_name: userData.fullname || '',
            phone: userData.phone || ''
          }
        }
      });

      if (authError) {
        const info = parseAuthError(authError);

        // Email already registered → log in instead of failing
        if (info.isRateLimit || info.isAlreadyRegistered) {
          const retry = await tryLoginAndReturn(supabase, normalizedEmail, password, { wantError: true });
          if (retry && !retry.error) {
            return retry;
          }
        }

        setAuthUserMessage(authError, 'register');
        return { data: null, error: authError, status: 'error' };
      }

      // Supabase returns empty identities when email already exists (anti-enumeration)
      if (isLikelyExistingUserFromSignup(authData)) {
        console.log('Register: email already exists, logging in');
        const retry = await tryLoginAndReturn(supabase, normalizedEmail, password, { wantError: true });
        if (retry) {
          return retry;
        }
        const err = new Error('This email is already registered. Use Login with your password.');
        err.userMessage = err.message;
        return { data: null, error: err, status: 'error' };
      }

      if (authData.user) {
        await new Promise(function(resolve) { setTimeout(resolve, 500); });
        await supabase
          .from('users')
          .update({
            full_name: userData.fullname || '',
            phone: userData.phone || ''
          })
          .eq('id', authData.user.id);
      }

      // 3) New user with session (Confirm email OFF) → logged in
      if (authData.session) {
        return { data: authData, error: null, status: 'registered', isNewUser: true };
      }

      // 4) New user, no session → try login (confirm email may be off but delayed)
      const afterSignup = await tryLoginAndReturn(supabase, normalizedEmail, password);
      if (afterSignup && !afterSignup.error) {
        afterSignup.isNewUser = true;
        afterSignup.status = 'registered';
        return afterSignup;
      }

      if (afterSignup && afterSignup.needsEmailConfirm) {
        return afterSignup;
      }

      return { data: authData, error: null, status: 'registered', isNewUser: true, needsEmailConfirm: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { data: null, error };
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result
   */
  async function loginUser(email, password) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized. Make sure supabase-config.js is loaded.');
      }
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        const error = new Error('Please enter a valid email address (example: name@gmail.com), not a username.');
        error.userMessage = error.message;
        return { data: null, error };
      }
      const { data, error } = await signInWithPassword(supabase, normalizedEmail, password);
      return { data, error };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  }

  /**
   * Resend signup confirmation email
   * @param {string} email - User email
   */
  async function resendConfirmationEmail(email) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized. Make sure supabase-config.js is loaded.');
      }
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: (typeof window.getAuthRedirectUrl === 'function'
            ? window.getAuthRedirectUrl()
            : (window.location.origin + '/auth/callback.html'))
        }
      });
      if (error) {
        setAuthUserMessage(error, 'resend');
      }
      return { data, error };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { data: null, error };
    }
  }

  /**
   * Logout current user
   * @returns {Promise<Object>} - Logout result
   */
  async function logoutUser() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Logout error:', error);
      return { error };
    }
  }

  /**
   * Get current user session
   * @returns {Promise<Object>} - Current session
   */
  async function getCurrentUser() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { user: null, error: new Error('Supabase client not initialized') };
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  }

  /**
   * Check if user is admin
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user is admin
   * Note: Role 1 = Admin, Role 2 = User
   */
  async function isAdmin(userId) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('isAdmin: Supabase client not available');
        return false;
      }
      console.log('isAdmin: Checking user ID:', userId);
      
      if (!userId) {
        console.error('isAdmin: No user ID provided');
        return false;
      }
      
      // Method 1: Try using the database function first (bypasses RLS)
      try {
        const { data: funcData, error: funcError } = await supabase
          .rpc('is_user_admin', { user_uuid: userId });
        
        if (!funcError && funcData !== null && funcData !== undefined) {
          console.log('isAdmin: Function result:', funcData);
          return funcData === true;
        }
      } catch (funcErr) {
        console.log('isAdmin: Function not available, trying direct query...', funcErr);
      }
      
      // Method 2: Fallback to direct query (must work with RLS)
      const { data, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', userId)
        .single();

      console.log('isAdmin query result:', { data, error, userId });

      if (error) {
        console.error('isAdmin error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If RLS error, try alternative: check via auth metadata
        if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('RLS Policy Error: User cannot read their own profile. Please run fix-rls-policies.sql in Supabase SQL Editor.');
        }
        
        return false;
      }
      
      if (!data) {
        console.error('isAdmin: No data returned from query');
        return false;
      }
      
      // Handle both integer and string comparisons (in case of type mismatch)
      const roleValue = data.role;
      const roleAsNumber = typeof roleValue === 'string' ? parseInt(roleValue, 10) : roleValue;
      const isAdminResult = roleAsNumber === 1;
      
      console.log('isAdmin: Role check details:', {
        roleValue: roleValue,
        roleType: typeof roleValue,
        roleAsNumber: roleAsNumber,
        isAdmin: isAdminResult,
        email: data.email,
        expected: 'role === 1 (integer)'
      });
      
      return isAdminResult; // 1 = Admin, 2 = User
    } catch (error) {
      console.error('Check admin error:', error);
      return false;
    }
  }

  // ===== BOOKINGS FUNCTIONS =====

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} - Created booking
   */
  async function createBooking(bookingData) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            service: bookingData.service,
            client: bookingData.client,
            email: bookingData.email,
            phone: bookingData.phone,
            date: bookingData.date,
            time: bookingData.time,
            location: bookingData.location,
            guests: bookingData.guests,
            status: bookingData.status || 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Create booking error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all bookings
   * @returns {Promise<Array>} - Array of bookings
   */
  async function getAllBookings() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Get bookings error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update booking status
   * @param {number} bookingId - Booking ID
   * @param {string} status - New status (pending, confirmed, cancelled)
   * @returns {Promise<Object>} - Updated booking
   */
  async function updateBookingStatus(bookingId, status) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
      
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', bookingId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Update booking error:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} - Delete result
   */
  async function deleteBooking(bookingId) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      return { error };
    } catch (error) {
      console.error('Delete booking error:', error);
      return { error };
    }
  }

  // ===== MESSAGES FUNCTIONS =====

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Created message
   */
  async function createMessage(messageData) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

      const normalizedEmail = normalizeEmail(messageData.email);

      // Prefer RPC (creates thread + admin notification)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_contact_thread', {
          p_name: messageData.name,
          p_email: normalizedEmail,
          p_subject: messageData.subject,
          p_body: messageData.message
        });
        if (!rpcError && rpcData) {
          return { data: rpcData, error: null, viaThread: true };
        }
        if (rpcError && !rpcError.message.includes('does not exist')) {
          console.warn('create_contact_thread RPC:', rpcError.message);
        }
      } catch (rpcErr) {
        console.warn('RPC unavailable, trying direct insert:', rpcErr);
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            name: messageData.name,
            email: normalizedEmail,
            subject: messageData.subject,
            message: messageData.message,
            read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Create message error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all messages
   * @returns {Promise<Array>} - Array of messages
   */
  async function getAllMessages() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Get messages error:', error);
      return { data: null, error };
    }
  }

  /**
   * Mark message as read
   * @param {number} messageId - Message ID
   * @returns {Promise<Object>} - Updated message
   */
  async function markMessageAsRead(messageId) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
      
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Mark message as read error:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a message
   * @param {number} messageId - Message ID
   * @returns {Promise<Object>} - Delete result
   */
  async function deleteMessage(messageId) {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      return { error };
    } catch (error) {
      console.error('Delete message error:', error);
      return { error };
    }
  }

  // Export functions for use in other files
  if (typeof window !== 'undefined') {
    window.db = {
      registerUser,
      loginUser,
      resendConfirmationEmail,
      logoutUser,
      getCurrentUser,
      isAdmin,
      createBooking,
      getAllBookings,
      updateBookingStatus,
      deleteBooking,
      createMessage,
      getAllMessages,
      markMessageAsRead,
      deleteMessage
    };
  }
})();
