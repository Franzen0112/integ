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

  // ===== AUTHENTICATION FUNCTIONS =====

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data (fullname, phone)
   * @returns {Promise<Object>} - Registration result
   */
  async function registerUser(email, password, userData = {}) {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        const error = new Error('Supabase client not initialized. Make sure supabase-config.js is loaded and Supabase library is available.');
        console.error('Registration failed:', error);
        return { data: null, error };
      }

      console.log('Attempting to register user:', email);
      
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: userData.fullname || '',
            phone: userData.phone || ''
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { data: null, error: authError };
      }

      console.log('Auth successful, user created:', authData.user?.id);

      // The trigger should automatically create the user profile
      // But we'll try to update it with additional data if needed
      if (authData.user) {
        // Wait a bit for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to update the user profile with additional data
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: userData.fullname || '',
            phone: userData.phone || ''
          })
          .eq('id', authData.user.id);

        if (updateError && !updateError.message.includes('duplicate') && !updateError.message.includes('does not exist')) {
          console.warn('Warning: Could not update user profile:', updateError);
          // Don't fail registration if profile update fails - trigger should have created it
        }
      }

      return { data: authData, error: null };
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      return { data, error };
    } catch (error) {
      console.error('Login error:', error);
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
      
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            name: messageData.name,
            email: messageData.email,
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
