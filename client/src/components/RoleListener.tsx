import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * This component doesn't render anything visible.
 * It listens for changes to the user role in localStorage and redirects if needed.
 */
const RoleListener: React.FC = () => {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Function to check permissions for current page
    const checkPermissions = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        const role = user.role || 'user';
        
        // Check if current page requires permissions
        if (location === '/manage-context' && role === 'user') {
          // Redirect from admin pages if user role
          setLocation('/');
        } else if ((location === '/manage-users' || location === '/usage-analytics') && 
                  (role === 'user' || role === 'admin')) {
          // Redirect from superadmin pages if not superadmin
          setLocation('/');
        }
      } catch (e) {
        console.error('Error checking permissions:', e);
      }
    };
    
    // Check permissions immediately
    checkPermissions();
    
    // Listen for storage events (role changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        checkPermissions();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up an interval to periodically check (backup approach)
    const intervalId = setInterval(checkPermissions, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [location, setLocation]);
  
  // This component doesn't render anything
  return null;
};

export default RoleListener;