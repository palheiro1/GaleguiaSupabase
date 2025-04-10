// Galeguia Course Admin App
// Main app initialization

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize functionality
  initAuth();  // From auth.js
  initCourses(); // From courses.js

  // Handle any routing/navigation if needed
  handleNavigation();
});

// Basic navigation handling (can be expanded for more complex routing)
function handleNavigation() {
  // Get current hash (for simple navigation)
  const hash = window.location.hash || '#login';
  
  // Handle navigation based on hash
  switch(hash) {
    case '#courses':
      // If the user is logged in, show courses screen
      if (currentUser) {
        showAuthenticatedView();
      } else {
        showUnauthenticatedView();
      }
      break;
    case '#login':
      // If already logged in, redirect to courses
      if (currentUser) {
        window.location.hash = '#courses';
      } else {
        showUnauthenticatedView();
        showLogin();
      }
      break;
    case '#signup':
      // If already logged in, redirect to courses
      if (currentUser) {
        window.location.hash = '#courses';
      } else {
        showUnauthenticatedView();
        showSignup();
      }
      break;
    default:
      // Default to login/courses based on auth status
      if (currentUser) {
        window.location.hash = '#courses';
      } else {
        window.location.hash = '#login';
      }
  }
  
  // Add hash change listener
  window.addEventListener('hashchange', function() {
    handleNavigation();
  });
}

// Add event listeners for navigation items
document.getElementById('nav-login').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.hash = '#login';
});

document.getElementById('nav-courses').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.hash = '#courses';
});

// Show notification toast for messages (can be used from any part of the app)
function showToast(message, type = 'info') {
  // Simple implementation - in a real app would be more sophisticated
  alert(message);
}
