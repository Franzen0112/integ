/**
 * Navigation Authentication Handler
 * Updates navigation buttons based on user login status
 */

// Function to check if user is logged in
function isUserLoggedIn() {
  return sessionStorage.getItem('userLoggedIn') === 'true' || 
         sessionStorage.getItem('adminLoggedIn') === 'true';
}

// Function to update navigation buttons
function updateNavigationButtons() {
  const authButtons = document.querySelector('.auth-buttons');
  
  if (!authButtons) {
    return; // No auth buttons found on this page
  }

  if (isUserLoggedIn()) {
    // User is logged in - show Logout only
    authButtons.innerHTML = `
      <a href="#" class="btn-logout" onclick="handleLogout(event)">LOGOUT</a>
    `;
  } else {
    // User is not logged in - show Login and Signup
    authButtons.innerHTML = `
      <a href="login.html" class="btn-login">LOGIN</a>
      <a href="register.html" class="btn-signup">SIGNUP</a>
    `;
  }
}

// Function to handle logout
async function handleLogout(event) {
  event.preventDefault();
  
  // Logout from Supabase if available
  if (window.db && window.db.logoutUser) {
    try {
      await window.db.logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  
  // Clear session storage
  sessionStorage.removeItem('userLoggedIn');
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem('userId');
  
  // Redirect to home page
  window.location.href = 'index.html';
}

// Update navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
  updateNavigationButtons();
});

// Also update when storage changes (in case of multiple tabs)
window.addEventListener('storage', function(e) {
  if (e.key === 'userLoggedIn' || e.key === 'adminLoggedIn') {
    updateNavigationButtons();
  }
});

