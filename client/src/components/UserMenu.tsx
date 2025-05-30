import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { User } from '@shared/schema';

interface UserMenuProps {
  userInfo: User | null;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userInfo, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!userInfo) return null;

  // Get initials from username
  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const userInitials = getUserInitials(userInfo.username);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center text-gray-700 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 bg-[hsl(var(--msblue-accent))] rounded-full flex items-center justify-center text-white font-semibold">
          <span>{userInitials}</span>
        </div>
        <span className="ml-2 hidden md:block">{userInfo.username}</span>
        <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-[hsl(var(--msneutral-medium))] rounded-md shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[hsl(var(--msneutral-light))]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
