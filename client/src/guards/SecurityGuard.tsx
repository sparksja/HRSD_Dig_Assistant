import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SecurityGuardProps {
  children: React.ReactNode;
}

/**
 * A global security guard that monitors all navigation and enforces 
 * role-based access control throughout the application.
 */
const SecurityGuard: React.FC<SecurityGuardProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Check permissions whenever location changes
    const checkPermissions = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
          // Not logged in
          if (location !== '/') {
            setLocation('/');
          }
          return;
        }
        
        const user = JSON.parse(userData);
        const role = user.role || 'user';
        
        // Define protected routes and their minimum required roles
        const protectedRoutes = [
          { path: '/manage-context', minRole: 'admin' },
          { path: '/manage-users', minRole: 'superadmin' },
          { path: '/usage-analytics', minRole: 'superadmin' },
        ];
        
        // Check if current location is protected
        const currentRoute = protectedRoutes.find(route => route.path === location);
        if (currentRoute) {
          // Check if user has sufficient permissions
          if (
            (currentRoute.minRole === 'admin' && role !== 'admin' && role !== 'superadmin') ||
            (currentRoute.minRole === 'superadmin' && role !== 'superadmin')
          ) {
            console.log(`Access denied to ${location}. Redirecting to home.`);
            setLocation('/');
          }
        }
      } catch (e) {
        console.error('Error checking permissions', e);
        setLocation('/');
      }
    };
    
    // Check permissions immediately when location changes
    checkPermissions();
    
    // Also listen for storage events (role changes in other tabs)
    const handleStorageChange = () => {
      checkPermissions();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location, setLocation]);
  
  return <>{children}</>;
};

export default SecurityGuard;