import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RobotLogo from './RobotLogo';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  onAuthenticated: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const { login, demoLogin } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Validate form
      if (!username.trim()) {
        setError('Please enter a username');
        setIsLoading(false);
        return;
      }
      
      if (!password.trim()) {
        setError('Please enter a password');
        setIsLoading(false);
        return;
      }
      
      // Call demo login with both username and password
      await demoLogin(username, password);
      onAuthenticated();
    } catch (error: any) {
      console.error('Demo login failed:', error);
      setError(error.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await login();
      onAuthenticated();
    } catch (error) {
      console.error('Microsoft login failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <RobotLogo className="w-12 h-12 mr-3" />
              <h2 className="text-xl font-semibold">HRSD Digital Assistant</h2>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              {isDemo 
                ? "Enter your credentials to access the Digital Assistant."
                : "Please sign in with your organizational credentials to access the Digital Assistant."}
            </p>
          </div>
          
          {isDemo ? (
            <form 
              className="space-y-4" 
              onSubmit={(e) => {
                e.preventDefault();
                handleDemoLogin();
              }}
            >
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}
            
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="text-center pt-2">
                <button 
                  type="button"
                  className="text-[hsl(var(--action-primary))] text-sm underline hover:text-[hsl(var(--action-primary-hover))]"
                  onClick={() => setIsDemo(false)}
                >
                  Use Microsoft Authentication
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Button 
                className="w-full flex items-center justify-center bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                onClick={handleMicrosoftLogin}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#fff" d="M1 1h10v10H1z" />
                  <path fill="#fff" d="M12 1h10v10H12z" />
                  <path fill="#fff" d="M1 12h10v10H1z" />
                  <path fill="#fff" d="M12 12h10v10H12z" />
                </svg>
                Sign in with Microsoft
              </Button>
              
              <div className="text-center pt-2">
                <button 
                  className="text-[hsl(var(--action-primary))] text-sm underline hover:text-[hsl(var(--action-primary-hover))]"
                  onClick={() => setIsDemo(true)}
                >
                  Use Demo Login
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Version indicator */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
        v6.2
      </div>
    </div>
  );
};

export default AuthModal;
