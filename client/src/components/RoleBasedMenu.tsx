import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Home, Search, Clock, Bookmark, Settings, Users, BarChart } from 'lucide-react';
import RobotLogo from './RobotLogo';

// This is a completely rewritten navigation component
// It focuses on simplicity and direct localStorage access for role checking

const RoleBasedMenu = ({ activePage = '/', className = '' }) => {
  // Start with a default role
  const [role, setRole] = useState('user');
  
  // This effect will run on mount and set up a timer to check for role changes
  useEffect(() => {
    // Function to check the current role from localStorage
    const checkCurrentRole = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          // Only update state if the role has changed
          if (user.role && user.role !== role) {
            setRole(user.role);
            console.log('Role changed to:', user.role);
          }
        }
      } catch (error) {
        console.error('Error reading role from localStorage:', error);
      }
    };
    
    // Check the role immediately
    checkCurrentRole();
    
    // Set up a timer to check the role every second
    const timer = setInterval(checkCurrentRole, 1000);
    
    // Clean up the timer when the component unmounts
    return () => clearInterval(timer);
  }, [role]); // Re-run if role changes to optimize comparison logic
  
  // CSS classes for navigation links
  const getLinkClass = (path: string) => {
    const isActive = activePage === path;
    return `flex items-center px-4 py-2 rounded-md ${
      isActive
        ? 'text-[hsl(var(--msblue-primary))] bg-[hsl(var(--msneutral-light))]'
        : 'text-gray-700 hover:bg-[hsl(var(--msneutral-light))]'
    }`;
  };
  
  // Check if user is admin or superadmin
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';
  
  return (
    <nav className={`w-64 bg-white border-r border-[hsl(var(--msneutral-medium))] p-4 ${className}`}>
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 bg-[hsl(var(--msblue-primary))] rounded-lg flex items-center justify-center mr-3">
          <RobotLogo className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold">HRSD Digital Assistant</h1>
      </div>
      
      <div className="space-y-1">
        {/* Regular user links - always visible */}
        <Link href="/" className={getLinkClass('/')}>
          <Home className="w-5 h-5 mr-3" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/search" className={getLinkClass('/search')}>
          <Search className="w-5 h-5 mr-3" />
          <span>Search Documents</span>
        </Link>
        
        <Link href="/recent" className={getLinkClass('/recent')}>
          <Clock className="w-5 h-5 mr-3" />
          <span>Conversation History</span>
        </Link>
        
        <Link href="/saved" className={getLinkClass('/saved')}>
          <Bookmark className="w-5 h-5 mr-3" />
          <span>Saved Conversations</span>
        </Link>
        
        {/* Admin section - only visible to admins and superadmins */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-[hsl(var(--msneutral-medium))]">
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </h3>
            </div>
            
            <Link href="/manage-context" className={getLinkClass('/manage-context')}>
              <Settings className="w-5 h-5 mr-3" />
              <span>Manage Context</span>
            </Link>
          </>
        )}
        
        {/* SuperAdmin links - only visible to superadmins */}
        {isSuperAdmin && (
          <>
            <Link href="/manage-users" className={getLinkClass('/manage-users')}>
              <Users className="w-5 h-5 mr-3" />
              <span>Manage Users</span>
            </Link>
            
            <Link href="/usage-analytics" className={getLinkClass('/usage-analytics')}>
              <BarChart className="w-5 h-5 mr-3" />
              <span>Usage Analytics</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default RoleBasedMenu;