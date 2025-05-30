import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AccessDenied from "@/pages/AccessDenied";
import Dashboard from "@/pages/Dashboard";
import Search from "@/pages/Search";
import RecentQueries from "@/pages/RecentQueries";
import SavedResponses from "@/pages/SavedResponses";
import ManageContext from "@/pages/ManageContext";
import ManageUsers from "@/pages/ManageUsers";
import UsageAnalytics from "@/pages/UsageAnalytics";
import AdminPortal from "@/pages/AdminPortal";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import { Context } from "@shared/schema";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { useQuery } from "@tanstack/react-query";

// Simple component to check admin permissions
const AdminRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  
  // Dynamic check based on current user role from localStorage
  const currentUserData = localStorage.getItem('currentUser');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const currentRole = currentUser?.role || user?.role;
  
  // Only admin or superadmin can access
  if (!(currentRole === 'admin' || currentRole === 'superadmin')) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">This page is only accessible to Admin users.</p>
      </div>
    );
  }
  
  return <Component />;
};

// Simple component to check super admin permissions
const SuperAdminRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const { isSuperAdmin, user } = useAuth();
  
  // Dynamic check based on current user role from localStorage
  const currentUserData = localStorage.getItem('currentUser');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const currentRole = currentUser?.role || user?.role;
  
  // Only superadmin can access
  if (currentRole !== 'superadmin') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">This page is only accessible to Super Admin users.</p>
      </div>
    );
  }
  
  return <Component />;
};

function Router() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [currentChatHistory, setCurrentChatHistory] = useState<{query: string, response: string, timestamp: Date}[]>([]);
  
  // Clear any cached context when component mounts
  useEffect(() => {
    localStorage.clear(); // Clear all localStorage
    sessionStorage.clear(); // Clear all sessionStorage
  }, []);
  
  // Use React Query to fetch contexts so they auto-refresh when cache is invalidated
  const { data: contexts = [] } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
    enabled: authenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Debug: Log the raw response from the server
  useEffect(() => {
    if (contexts) {
      console.log('Raw contexts from React Query:', JSON.stringify(contexts, null, 2));
    }
  }, [contexts]);

  // Auto-select the first available context if none is selected
  useEffect(() => {
    console.log('Available contexts from server:', contexts);
    if (contexts.length > 0) {
      // Always force select the first available context to ensure we use the correct ID
      const validContext = contexts.find(c => c.id && c.id > 0);
      if (validContext) {
        setSelectedContext(validContext);
        console.log('Force selecting valid context:', validContext);
      }
    } else {
      setSelectedContext(null);
    }
  }, [contexts]);

  if (!authenticated) {
    return <AuthModal onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <Layout
      contexts={contexts}
      selectedContext={selectedContext}
      onContextChange={setSelectedContext}
    >
      <Switch>
        <Route path="/">
          <Dashboard 
            selectedContext={selectedContext}
            chatHistory={currentChatHistory}
            onChatUpdate={setCurrentChatHistory}
          />
        </Route>
        <Route path="/saved" component={SavedResponses} />
        <Route path="/admin" component={AdminPortal} />
        <Route path="/manage-context">
          {() => {
            // Direct check against localStorage for most current role
            const userData = localStorage.getItem('currentUser');
            const user = userData ? JSON.parse(userData) : null;
            const role = user?.role || 'user';
            
            // Only admin or superadmin can access
            if (role === 'admin' || role === 'superadmin') {
              return <ManageContext />;
            }
            
            // Redirect if unauthorized
            window.location.href = '/';
            return null;
          }}
        </Route>
        <Route path="/manage-users">
          {() => {
            // Direct check against localStorage for most current role
            const userData = localStorage.getItem('currentUser');
            const user = userData ? JSON.parse(userData) : null;
            const role = user?.role || 'user';
            
            // Only superadmin can access
            if (role === 'superadmin') {
              return <ManageUsers />;
            }
            
            // Show access denied page with the right context
            return <AccessDenied />;
          }}
        </Route>
        <Route path="/usage-analytics">
          {() => {
            // Direct check against localStorage for most current role
            const userData = localStorage.getItem('currentUser');
            const user = userData ? JSON.parse(userData) : null;
            const role = user?.role || 'user';
            
            // Only superadmin can access
            if (role === 'superadmin') {
              return <UsageAnalytics />;
            }
            
            // Show access denied page with the right context
            return <AccessDenied />;
          }}
        </Route>
        <Route path="/access-denied" component={AccessDenied} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

import RoleListener from "./components/RoleListener";
import SecurityGuard from "./guards/SecurityGuard";

function LogoutMessageHandler() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if we need to show a logout message (set by AuthProvider.logout)
    const shouldShowLogoutMessage = sessionStorage.getItem('showLogoutMessage');
    
    if (shouldShowLogoutMessage) {
      // Remove the flag immediately to prevent showing the message multiple times
      sessionStorage.removeItem('showLogoutMessage');
      
      // Show the logout toast
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    }
  }, [toast]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <LogoutMessageHandler />
          <SecurityGuard>
            <RoleListener />
            <Router />
          </SecurityGuard>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
