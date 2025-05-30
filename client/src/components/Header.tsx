import React from 'react';
import RobotLogo from './RobotLogo';
import ContextSelector from './ContextSelector';
import UserMenu from './UserMenu';
import { Context, User } from '@shared/schema';
import { Menu } from 'lucide-react';

interface HeaderProps {
  userInfo: User | null;
  onLogout: () => void;
  contextList: Context[];
  selectedContext: Context | null;
  onContextChange: (context: Context) => void;
  onOpenMobileMenu: () => void;
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({
  userInfo,
  onLogout,
  contextList,
  selectedContext,
  onContextChange,
  onOpenMobileMenu,
  currentPage
}) => {
  if (!userInfo) {
    return (
      <header className="bg-white border-b border-[hsl(var(--msneutral-medium))]">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center">
            <RobotLogo className="w-10 h-10 mr-3" />
            <h1 className="text-xl font-semibold">HRSD Digital Assistant</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white border-b border-[hsl(var(--msneutral-medium))] hidden md:block">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center">
            <RobotLogo className="w-10 h-10 mr-3" />
            <h1 className="text-xl font-semibold">HRSD Digital Assistant</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <ContextSelector 
              contextList={contextList}
              selectedContext={selectedContext}
              onContextChange={onContextChange}
            />
            
            <UserMenu 
              userInfo={userInfo}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[hsl(var(--msneutral-medium))] w-full">
        <div className="flex justify-between px-4 py-2">
          <button 
            className="text-gray-700 focus:outline-none"
            onClick={onOpenMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2">{currentPage}</span>
          </div>
          <div className="w-6">
            {/* Empty div for flex balance */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
