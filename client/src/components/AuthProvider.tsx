import React, { createContext, useState, useContext, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from '@/lib/msalConfig';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => void;
  demoLogin: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isSuperAdmin: false,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  demoLogin: async () => {},
});

// Demo user credentials
const DEMO_CREDENTIALS: Record<string, {
  password: string;
  role: string;
  displayName: string;
}> = {
  "lab_technician": {
    password: "HrsdLAB2025!",
    role: "user",
    displayName: "Lab Technician"
  },
  "tsd_supervisor": {
    password: "HrsdTSD2025!",
    role: "admin",
    displayName: "TSD Supervisor"
  },
  "plant_lead_operator": {
    password: "HrsdOPS2025!",
    role: "superadmin",
    displayName: "Plant Lead Operator"
  },
  "dig_water_eng": {
    password: "HrsdDW2025!",
    role: "superadmin",
    displayName: "Digital Water Engineer"
  }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, inProgress } = useMsal();
  const msalAuthenticated = useIsAuthenticated();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Restore authentication state from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('Restored user session:', userData.username, userData.role);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Check if user is authenticated via MSAL
  useEffect(() => {
    if (msalAuthenticated && inProgress === InteractionStatus.None) {
      setIsAuthenticated(true);
      fetchUserData();
    }
  }, [msalAuthenticated, inProgress]);

  const fetchUserData = async () => {
    try {
      const response = await apiRequest('GET', '/api/user/profile');
      const userData = await response.json();
      setUser(userData);
      
      // Store user data in localStorage for authentication
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      });
    }
  };

  // Microsoft login
  const login = async () => {
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response) {
        await fetchUserData();
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Please try again or contact IT support',
        variant: 'destructive',
      });
    }
  };

  // Demo login with credentials validation
  const demoLogin = async (username: string, password: string) => {
    try {
      // Validate credentials against our demo users
      const demoUserKey = username.toLowerCase();
      
      if (!DEMO_CREDENTIALS[demoUserKey]) {
        throw new Error('Invalid username or password');
      }
      
      if (DEMO_CREDENTIALS[demoUserKey].password !== password) {
        throw new Error('Invalid username or password');
      }
      
      // Create user object
      const userInfo = DEMO_CREDENTIALS[demoUserKey];
      
      // Assign correct ID based on username
      let userId = 1;
      if (demoUserKey === 'tsd_supervisor') userId = 2;
      if (demoUserKey === 'plant_lead_operator') userId = 3;
      if (demoUserKey === 'dig_water_eng') userId = 4;
      
      const demoUser: User = {
        id: userId,
        username: demoUserKey,
        email: `${demoUserKey}@hrsd.example.com`,
        displayName: userInfo.displayName,
        azureId: `demo-${demoUserKey}-id`,
        role: userInfo.role,
        lastLogin: new Date()
      };
      
      // Store in state and localStorage for authentication
      setUser(demoUser);
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      setIsAuthenticated(true);
      
      // Add CSS class to body based on role
      document.body.classList.remove('role-user', 'role-admin', 'role-superadmin');
      document.body.classList.add(`role-${userInfo.role}`);
      
      // Force navigation to refresh
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: 'Login Successful',
        description: `Welcome, ${demoUser.username}!`,
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Demo login failed:', error);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Logout for both MSAL and demo
  const logout = () => {
    // Immediately redirect to home page first to avoid any page-specific errors
    // This prevents protected pages from trying to access data after auth is cleared
    window.location.href = '/';
    
    // Set a flag in sessionStorage to show the logout toast after redirect
    sessionStorage.setItem('showLogoutMessage', 'true');
    
    // Clear authentication data after a slight delay
    setTimeout(() => {
      // If user is authenticated via MSAL, logout from there
      if (msalAuthenticated) {
        instance.logoutPopup({
          postLogoutRedirectUri: window.location.origin,
        });
      }
      
      // Clear local state and stored user data
      localStorage.removeItem('currentUser');
      setIsAuthenticated(false);
      setUser(null);
    }, 100);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isSuperAdmin: user?.role === 'superadmin',
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        login,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
