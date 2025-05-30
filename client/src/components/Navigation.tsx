import React from 'react';
import { Link } from 'wouter';
import { 
  Home, Search, Clock, Bookmark, Settings
} from 'lucide-react';
import RobotLogo from './RobotLogo';
import hrsdLogoPath from '@assets/image_1748062570869.png';

interface NavigationProps {
  userRole: 'superadmin' | 'admin' | 'user';
  activePage: string;
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activePage,
  className = ""
}) => {
  // Read directly from localStorage on every render - no stale data
  let currentRole = 'user';
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      currentRole = user.role || 'user';
    }
  } catch (e) {
    console.error('Error reading user role', e);
  }

  // Regular user navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/saved', label: 'Saved Conversations', icon: Bookmark }
  ];

  const getLinkClasses = (path: string) => {
    const isActive = activePage === path;
    return `flex items-center px-4 py-2 rounded-md ${
      isActive
        ? 'text-[hsl(var(--nav-primary))] bg-[hsl(var(--msneutral-light))]'
        : 'text-gray-700 hover:bg-[hsl(var(--msneutral-light))] hover:text-[hsl(var(--nav-primary))]'
    }`;
  };

  // Simple direct checks for showing admin content
  const isAdmin = currentRole === 'admin' || currentRole === 'superadmin';

  return (
    <nav className={`w-64 bg-white border-r border-[hsl(var(--msneutral-medium))] p-4 flex flex-col h-full relative ${className}`}>
      {/* Logo removed to avoid duplication with header */}
      <div className="mt-4 mb-8"></div>

      <div className="space-y-1 flex-1">
        {/* Regular user links - always visible */}
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={getLinkClasses(item.path)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </Link>
        ))}
        
        {/* Admin section header - visible for all users */}
        <div className="pt-4 mt-4 border-t border-[hsl(var(--msneutral-medium))]">
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
        </div>
        
        {/* Admin Portal Link - visible for all users, but will show different content based on role */}
        <Link 
          href="/admin"
          className={getLinkClasses('/admin')}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span>Admin Portal</span>
        </Link>
      </div>

      {/* HRSD Logo at bottom - positioned 20px up from bottom */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
        <img 
          src={hrsdLogoPath} 
          alt="HRSD Logo" 
          className="w-32 h-auto object-contain"
        />
      </div>
    </nav>
  );
};

export default Navigation;