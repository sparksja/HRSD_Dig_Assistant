import React, { useEffect } from 'react';
import { UserRole } from '@shared/schema';

/**
 * This component doesn't render anything visible.
 * It directly manipulates the DOM to hide/show menu items based on user role.
 * This is a brute-force approach for when React state updates aren't working properly.
 */
const RoleBasedNavigation: React.FC = () => {
  useEffect(() => {
    // Function to check if admin links should be visible
    const updateNavigationVisibility = () => {
      try {
        // Get current user data from localStorage
        const userData = localStorage.getItem('currentUser');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        const currentRole = user?.role || 'user';
        
        // Get all links that should only be visible to superadmins
        const superAdminLinks = document.querySelectorAll('[data-role="superadmin"]');
        // Get all links that should be visible to admins and superadmins
        const adminLinks = document.querySelectorAll('[data-role="admin"]');
        
        // Update visibility based on role
        superAdminLinks.forEach(link => {
          if (currentRole === 'superadmin') {
            link.classList.remove('hidden');
          } else {
            link.classList.add('hidden');
          }
        });
        
        adminLinks.forEach(link => {
          if (currentRole === 'admin' || currentRole === 'superadmin') {
            link.classList.remove('hidden');
          } else {
            link.classList.add('hidden');
          }
        });
      } catch (error) {
        console.error('Error updating navigation visibility:', error);
      }
    };
    
    // Check initially
    updateNavigationVisibility();
    
    // Set up interval to check regularly
    const intervalId = setInterval(updateNavigationVisibility, 500);
    
    // Also listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        updateNavigationVisibility();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default RoleBasedNavigation;