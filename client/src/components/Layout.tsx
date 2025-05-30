import React, { useState, useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import MobileMenu from './MobileMenu';
import { Context } from '@shared/schema';
import { useAuth } from './AuthProvider';
import { useLocation } from 'wouter';
import RoleBasedNavigation from './RoleBasedNavigation';

interface LayoutProps {
  children: React.ReactNode;
  contexts: Context[];
  selectedContext: Context | null;
  onContextChange: (context: Context) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  contexts,
  selectedContext,
  onContextChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const [location] = useLocation();
  
  // Force re-render when user role changes by adding key with user role
  const userRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'user');

  // Extract current page name from location for mobile header
  const getCurrentPageName = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/search':
        return 'Search Documents';
      case '/recent':
        return 'Recent Queries';
      case '/saved':
        return 'Saved Responses';
      case '/manage-context':
        return 'Manage Context';
      case '/manage-users':
        return 'Manage Users';
      case '/usage-analytics':
        return 'Usage Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* This invisible component handles role-based navigation changes */}
      <RoleBasedNavigation />
      
      <Header
        userInfo={user}
        onLogout={logout}
        contextList={contexts}
        selectedContext={selectedContext}
        onContextChange={onContextChange}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        currentPage={getCurrentPageName()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Navigation 
          userRole={userRole}
          activePage={location}
          className="hidden md:block"
          key={`nav-${Date.now()}`} // Force re-render with unique key every time
        />

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          userRole={userRole}
          activePage={location}
          key={`mobile-${userRole}`} // Force re-render when role changes
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
