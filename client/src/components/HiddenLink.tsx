import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { UserRole } from '@shared/schema';

interface HiddenLinkProps {
  path: string;
  className?: string;
  requiredRole: UserRole | UserRole[];
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * A wrapper around the Link component that only renders if the user has the required role
 * This component directly reads from localStorage on every render and on a timer
 */
const HiddenLink: React.FC<HiddenLinkProps> = ({
  path,
  className,
  requiredRole,
  children,
  onClick
}) => {
  const [hasPermission, setHasPermission] = useState(false);

  // Function to check if user has required role
  const checkPermission = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        setHasPermission(false);
        return;
      }

      const user = JSON.parse(userData);
      const userRole = user?.role || 'user';
      
      if (Array.isArray(requiredRole)) {
        // Check if user role is in the array of allowed roles
        setHasPermission(requiredRole.includes(userRole));
      } else {
        // Check if user role matches the required role
        setHasPermission(userRole === requiredRole);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  // Check permissions on mount and set up interval to check regularly
  useEffect(() => {
    // Initial check
    checkPermission();
    
    // Set up interval to check permissions every 500ms
    const intervalId = setInterval(checkPermission, 500);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Don't render anything if user doesn't have permission
  if (!hasPermission) {
    return null;
  }

  // Render the link if user has permission
  return (
    <Link href={path} className={className} onClick={onClick}>
      {children}
    </Link>
  );
};

export default HiddenLink;