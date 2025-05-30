import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { X, Home, Search, Clock, Bookmark, Settings, Users, BarChart } from 'lucide-react';
import RobotLogo from './RobotLogo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'superadmin' | 'admin' | 'user';
  activePage: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  userRole,
  activePage
}) => {
  if (!isOpen) return null;
  
  // Start with the passed userRole, but will be updated from localStorage
  const [currentRole, setCurrentRole] = useState(userRole);
  
  useEffect(() => {
    // Function to get current role from localStorage - this is ALWAYS up to date
    const getCurrentRole = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData && parsedData.role) {
            setCurrentRole(parsedData.role);
          }
        }
      } catch (error) {
        console.error('Error reading role from localStorage', error);
      }
    };
    
    // Read role on mount
    getCurrentRole();
    
    // Set up interval to check regularly
    const intervalId = setInterval(getCurrentRole, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Regular user links - always visible to everyone
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/saved', label: 'Saved Conversations', icon: Bookmark }
  ];
  
  // Admin-only links - visible to admins and superadmins
  const adminItems = [
    { path: '/manage-context', label: 'Manage Context', icon: Settings }
  ];
  
  // SuperAdmin-only links - visible only to superadmins
  const superAdminItems = [
    { path: '/manage-users', label: 'Manage Users', icon: Users },
    { path: '/usage-analytics', label: 'Usage Analytics', icon: BarChart }
  ];

  const getItemClasses = (path: string) => {
    const isActive = activePage === path;
    return `flex items-center px-4 py-2 rounded-md ${
      isActive
        ? 'text-[hsl(var(--msblue-primary))] bg-[hsl(var(--msneutral-light))]'
        : 'text-gray-700 hover:bg-[hsl(var(--msneutral-light))]'
    }`;
  };

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-[hsl(var(--msneutral-medium))]">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[hsl(var(--msblue-primary))] rounded-lg flex items-center justify-center mr-2">
              <RobotLogo className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold">HRSD Digital Assistant</h2>
          </div>
          <button className="text-gray-700" onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-1">
            {/* Regular user links - always visible */}
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path} 
                className={getItemClasses(item.path)}
                onClick={onClose}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Admin section header - only visible if user is admin or superadmin */}
            {(currentRole === 'admin' || currentRole === 'superadmin') && (
              <div className="pt-4 mt-4 border-t border-[hsl(var(--msneutral-medium))]">
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
              </div>
            )}
            
            {/* Admin Portal Link - Single entry point for all admin functions */}
            {(currentRole === 'admin' || currentRole === 'superadmin') && (
              <Link 
                href="/admin" 
                className={getItemClasses('/admin')}
                onClick={onClose}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;