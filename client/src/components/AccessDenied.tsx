import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { AlertTriangle } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole: 'admin' | 'superadmin';
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
  const [, setLocation] = useLocation();
  
  // Automatically redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation('/');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {requiredRole === 'admin' 
          ? "This page requires Admin permissions."
          : "This page requires Super Admin permissions."}
        <br />
        Please contact your administrator if you need access.
      </p>
      <p className="text-sm text-gray-500">Redirecting to dashboard in 3 seconds...</p>
      <button 
        onClick={() => setLocation('/')}
        className="mt-4 px-4 py-2 bg-[hsl(var(--msblue-primary))] text-white rounded-md hover:bg-[hsl(var(--msblue-dark))]"
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default AccessDenied;