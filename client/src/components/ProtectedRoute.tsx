import React, { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  adminOnly = false, 
  superAdminOnly = false
}) => {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [localRole, setLocalRole] = useState('user');
  
  // Double-check localStorage permissions on each render
  useEffect(() => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setLocalRole(user.role || 'user');
      }
    } catch (e) {
      console.error('Error reading user role from localStorage', e);
    }
    
    // Listen for storage events to detect role changes in other tabs/windows
    const handleStorageChange = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          setLocalRole(user.role || 'user');
        }
      } catch (e) {
        console.error('Error reading user role from localStorage', e);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Get realtime permissions directly from localStorage (most current)
  const hasLocalAdminAccess = localRole === 'admin' || localRole === 'superadmin';
  const hasLocalSuperAdminAccess = localRole === 'superadmin';
  
  // First check React state, then double-check localStorage as backup
  const hasAdminAccess = isAdmin || hasLocalAdminAccess;
  const hasSuperAdminAccess = isSuperAdmin || hasLocalSuperAdminAccess;
  
  // Check if the user is authenticated
  if (!isAuthenticated) {
    setLocation('/');
    return null;
  }
  
  // Check for admin access
  if (adminOnly && !hasAdminAccess) {
    setLocation('/');
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">This page is only accessible to Admin users.</p>
      </div>
    );
  }
  
  // Check for super admin access
  if (superAdminOnly && !hasSuperAdminAccess) {
    setLocation('/');
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">This page is only accessible to Super Admin users.</p>
      </div>
    );
  }
  
  // User has required permissions, render the component
  return <Component />;
};

export default ProtectedRoute;