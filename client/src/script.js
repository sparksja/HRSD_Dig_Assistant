// This script will run on every page load to check permissions
// and redirect users who try to access unauthorized pages

document.addEventListener('DOMContentLoaded', function() {
  // Get current user role from localStorage
  let role = 'user';
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      role = user.role || 'user';
    }
  } catch (e) {
    console.error('Error reading user role from localStorage', e);
  }
  
  // Get current page path
  const path = window.location.pathname;
  
  // Define restricted pages
  const adminOnlyPages = ['/manage-context'];
  const superAdminOnlyPages = ['/manage-users', '/usage-analytics'];
  
  // Check if current page is restricted
  if (role === 'user' && adminOnlyPages.includes(path)) {
    window.location.href = '/';
  }
  
  if ((role === 'user' || role === 'admin') && superAdminOnlyPages.includes(path)) {
    window.location.href = '/';
  }
  
  // Set role class on body for CSS-based visibility control
  document.body.classList.add(`role-${role}`);
});