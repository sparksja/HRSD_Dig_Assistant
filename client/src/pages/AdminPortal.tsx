import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, BarChart, Shield, User } from 'lucide-react';

const AdminPortal = () => {
  const [location, setLocation] = useLocation();
  // State to store user information
  const [userInfo, setUserInfo] = useState({
    username: '',
    role: 'user',
    displayName: ''
  });

  // Check permissions on load and get user info
  useEffect(() => {
    const getUserData = async () => {
      try {
        // First get direct from database for accurate role
        const response = await fetch('/api/users');
        const allUsers = await response.json();
        
        // Also check localStorage for the current user
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
          // Allow the user to stay but they'll see the empty state
          setUserInfo({
            username: '',
            role: 'user',
            displayName: ''
          });
          return;
        }
        
        const localUser = JSON.parse(userData);
        
        // Find the matching user in the database to get accurate role
        const dbUser = allUsers.find((u) => u.username === localUser.username);
        
        if (dbUser) {
          // Use the role from the database (source of truth)
          setUserInfo({
            username: dbUser.username || '',
            role: dbUser.role || 'user',
            displayName: dbUser.displayName || dbUser.username || ''
          });
          
          // Refresh localStorage with the correct role from database
          localStorage.setItem('currentUser', JSON.stringify({
            ...localUser,
            role: dbUser.role
          }));
        } else {
          // Fallback to localStorage if user not found in DB
          setUserInfo({
            username: localUser.username || '',
            role: localUser.role || 'user',
            displayName: localUser.displayName || localUser.username || ''
          });
        }
      } catch (e) {
        console.error('Error checking permissions', e);
        
        // Fallback to localStorage if API fails
        try {
          const userData = localStorage.getItem('currentUser');
          if (userData) {
            const user = JSON.parse(userData);
            setUserInfo({
              username: user.username || '',
              role: user.role || 'user',
              displayName: user.displayName || user.username || ''
            });
          }
        } catch (err) {
          console.error('Final fallback error', err);
        }
      }
    };
    
    getUserData();
    
    // Set up a refresh interval to keep role information in sync
    const intervalId = setInterval(() => {
      getUserData();
    }, 5000); // Check every 5 seconds
    
    // Also add event listener for storage events to detect role changes
    const handleStorageChange = () => {
      getUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [setLocation]);

  const isAdmin = userInfo.role === 'admin' || userInfo.role === 'superadmin';
  const isSuperAdmin = userInfo.role === 'superadmin';

  // Display different content based on role
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>
      
      {/* For regular users - just show them a message */}
      {userInfo.role === 'user' && (
        <div className="flex flex-col items-center justify-center bg-gray-50 p-10 rounded-lg border border-gray-200 text-center">
          <Shield className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admin Area</h2>
          <p className="text-gray-600 max-w-md mb-6">
            This area is for administrative users. You currently don't have any administrative privileges.
            Please contact an administrator if you need access to these features.
          </p>
        </div>
      )}
      
      {/* For admins and superadmins - show the full interface */}
      {(isAdmin || isSuperAdmin) && (
        <>
          {/* User information banner */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <span className="font-medium">Current User: </span>{userInfo.username}
                <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full ${
                  isSuperAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-8">
            Welcome to the Admin Portal. The functions below are available based on your role permissions.
          </p>

          <div className="grid grid-cols-1 gap-6">
            {/* Admin Menu */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-500 mr-2" />
                  <CardTitle className="text-xl">Administrative Functions</CardTitle>
                </div>
                <CardDescription>
                  Your role gives you access to the following functions.
                </CardDescription>
              </CardHeader>
              <div className="p-6 space-y-4">
                {/* This is available to both admins and superadmins */}
                <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-4 text-[hsl(var(--msblue-primary))]" />
                    <div>
                      <h3 className="font-medium">Manage Document Contexts</h3>
                      <p className="text-sm text-gray-500">Add, edit, or remove document contexts from SharePoint</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation('/manage-context')}
                    className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                  >
                    Access
                  </Button>
                </div>
                
                {/* Only show Manage Users option to superadmins */}
                {isSuperAdmin && (
                  <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-4 text-[hsl(var(--msblue-primary))]" />
                      <div>
                        <h3 className="font-medium">Manage Users</h3>
                        <p className="text-sm text-gray-500">Manage user accounts and roles</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation('/manage-users')}
                      className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                    >
                      Access
                    </Button>
                  </div>
                )}
                
                {/* Only show Usage Analytics to superadmins */}
                {isSuperAdmin && (
                  <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <BarChart className="w-5 h-5 mr-4 text-[hsl(var(--msblue-primary))]" />
                      <div>
                        <h3 className="font-medium">Usage Analytics</h3>
                        <p className="text-sm text-gray-500">View system usage statistics and analytics</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation('/usage-analytics')}
                      className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                    >
                      Access
                    </Button>
                  </div>
                )}
                
                {/* Note for admins explaining why they don't see certain features */}
                {isAdmin && !isSuperAdmin && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Some administrative features are only available to Super Admin users. Contact a Super Admin if you need to access these features.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPortal;