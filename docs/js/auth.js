// Galeguia Authentication Functions

// DOM Elements
const loginForm = document.getElementById('form-login');
const signupForm = document.getElementById('form-signup');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const loginContainer = document.getElementById('login-form');
const signupContainer = document.getElementById('signup-form');
const authContainer = document.getElementById('auth-container');
const adminContainer = document.getElementById('admin-container');
const navLogin = document.getElementById('nav-login');
const navCourses = document.getElementById('nav-courses');
const navLogout = document.getElementById('nav-logout');

// Current authenticated user
let currentUser = null;

// Show/hide auth form containers
function showLogin() {
  loginContainer.classList.remove('hidden');
  signupContainer.classList.add('hidden');
}

function showSignup() {
  loginContainer.classList.add('hidden');
  signupContainer.classList.remove('hidden');
}

// Toggle between authenticated and non-authenticated view
function showAuthenticatedView() {
  authContainer.classList.add('hidden');
  adminContainer.classList.remove('hidden');
  navLogin.classList.add('hidden');
  navCourses.classList.remove('hidden');
  navLogout.classList.remove('hidden');
  loadUserCourses(); // Load initial data
}

function showUnauthenticatedView() {
  authContainer.classList.remove('hidden');
  adminContainer.classList.add('hidden');
  navLogin.classList.remove('hidden');
  navCourses.classList.add('hidden');
  navLogout.classList.add('hidden');
  showLogin(); // Always default to login view
}

// Login handler
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    loginError.classList.add('hidden');
    currentUser = data.user;
    showAuthenticatedView();
  } catch (error) {
    loginError.textContent = error.message || 'Error logging in';
    loginError.classList.remove('hidden');
  }
}

// Signup handler
async function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const fullName = document.getElementById('signup-fullname').value;
  
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    // Show success message
    signupContainer.innerHTML = `
      <div class="alert alert-success">
        <h4>Account created successfully!</h4>
        <p>Please check your email for a confirmation link. Once confirmed, you can log in.</p>
        <button class="btn btn-primary mt-3" id="back-to-login">Back to Login</button>
      </div>
    `;
    
    document.getElementById('back-to-login').addEventListener('click', showLogin);
    
  } catch (error) {
    signupError.textContent = error.message || 'Error creating account';
    signupError.classList.remove('hidden');
  }
}

// Logout handler
async function handleLogout() {
  try {
    await supabase.auth.signOut();
    currentUser = null;
    showUnauthenticatedView();
  } catch (error) {
    console.error('Error signing out:', error.message);
  }
}

// Check current session on page load
async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (data.session) {
      currentUser = data.session.user;
      showAuthenticatedView();
    } else {
      showUnauthenticatedView();
    }
  } catch (error) {
    console.error('Error checking session:', error.message);
    showUnauthenticatedView();
  }
}

// Add event listeners
function setupAuthListeners() {
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  showSignupBtn.addEventListener('click', showSignup);
  showLoginBtn.addEventListener('click', showLogin);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      showAuthenticatedView();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showUnauthenticatedView();
    }
  });
}

// Initialize auth
function initAuth() {
  setupAuthListeners();
  checkSession();
}
