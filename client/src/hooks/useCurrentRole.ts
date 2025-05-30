import { useState, useEffect } from 'react';
import { UserRole } from '@shared/schema';

/**
 * Custom hook to get the current user role from localStorage
 * This provides a reactive way to access the most up-to-date role
 */
export function useCurrentRole(initialRole: UserRole): UserRole {
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  
  useEffect(() => {
    // Get initial role from localStorage
    updateRoleFromStorage();
    
    // Create interval to check localStorage every 500ms for role changes
    const intervalId = setInterval(updateRoleFromStorage, 500);
    
    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', updateRoleFromStorage);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', updateRoleFromStorage);
    };
  }, []);
  
  function updateRoleFromStorage() {
    try {
      const currentUserData = localStorage.getItem('currentUser');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData);
        if (currentUser?.role && currentUser.role !== currentRole) {
          setCurrentRole(currentUser.role as UserRole);
        }
      }
    } catch (error) {
      console.error('Error reading role from localStorage:', error);
    }
  }
  
  return currentRole;
}