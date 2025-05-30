import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Home, Search, Clock, Bookmark, Settings, Users, BarChart } from 'lucide-react';
import RobotLogo from './RobotLogo';

/**
 * A simplified navigation component that directly checks localStorage for role permissions
 */
const DirectNavbar = ({ activePage = '/', className = "" }) => {
  // Track current role
  const [currentRole, setCurrentRole] = useState('user');
  
  // Check localStorage directly for user role
  useEffect(() => {
    try {
      const checkRole = () => {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentRole(user.role || 'user');
        }
      };
      
      // Check immediately
      checkRole();
      
      // Set interval to check regularly
      const interval = setInterval(checkRole, 1000);
      
      return () => clearInterval(interval);
    } catch (e) {
      console.error('Error checking role:', e);
    }
  }, []);
  
  // User links (available to all users)
  const userLinks = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/search', label: 'Search Documents', icon: Search },
    { path: '/recent', label: 'Conversation History', icon: Clock },
    { path: '/saved', label: 'Saved Conversations', icon: Bookmark },
  ];
  
  // Admin links (available to admin and superadmin)
  const adminLinks = [
    { path: '/manage-context', label: 'Manage Context', icon: Settings },
  ];
  
  // SuperAdmin links (available only to superadmin)
  const superAdminLinks = [
    { path: '/manage-users', label: 'Manage Users', icon: Users },
    { path: '/usage-analytics', label: 'Usage Analytics', icon: BarChart },
  ];
  
  // Determine if user is admin or superadmin
  const isAdmin = currentRole === 'admin' || currentRole === 'superadmin';
  const isSuperAdmin = currentRole === 'superadmin';
  
  // Link styles based on active state
  const getLinkStyles = (path) => {
    const isActive = activePage === path;
    return `flex items-center px-4 py-2 rounded-md ${
      isActive 
        ? 'text-[hsl(var(--msblue-primary))] bg-[hsl(var(--msneutral-light))]' 
        : 'text-gray-700 hover:bg-[hsl(var(--msneutral-light))]'
    }`;
  };
  
  return (
    <nav className={`w-64 bg-white border-r border-[hsl(var(--msneutral-medium))] p-4 ${className}`}>
      {/* App logo and title */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-[hsl(var(--msblue-primary))] rounded-lg flex items-center justify-center mr-3">
          <RobotLogo className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold">HRSD Digital Assistant</h1>
      </div>
      
      <div className="space-y-1">
        {/* User links - always visible */}
        {userLinks.map(link => (
          <Link 
            key={link.path} 
            href={link.path} 
            className={getLinkStyles(link.path)}
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span>{link.label}</span>
          </Link>
        ))}
        
        {/* Admin section - only visible to admin and superadmin */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-[hsl(var(--msneutral-medium))]">
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </h3>
            </div>
            
            {/* Admin links */}
            {adminLinks.map(link => (
              <Link 
                key={link.path} 
                href={link.path} 
                className={getLinkStyles(link.path)}
              >
                <link.icon className="w-5 h-5 mr-3" />
                <span>{link.label}</span>
              </Link>
            ))}
          </>
        )}
        
        {/* SuperAdmin links - only visible to superadmin */}
        {isSuperAdmin && superAdminLinks.map(link => (
          <Link 
            key={link.path} 
            href={link.path} 
            className={getLinkStyles(link.path)}
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default DirectNavbar;