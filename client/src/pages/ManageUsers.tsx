import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

import { format } from 'date-fns';
import { User as UserType } from '@shared/schema';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Form schema for adding admin users
const addAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'superadmin']),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

const ManageUsers: React.FC = () => {
  // Direct access control in the component
  // Get current user role directly from localStorage
  const userData = localStorage.getItem('currentUser');
  const currentUser = userData ? JSON.parse(userData) : null;
  const currentRole = currentUser?.role || 'user';
  
  // If not a superadmin, show unauthorized message
  if (currentRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 text-center max-w-md mb-6">
          This page requires Super Admin permissions.
          <br />
          Please contact your administrator if you need access.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-[hsl(var(--action-primary))] text-white rounded-md hover:bg-[hsl(var(--action-primary-hover))]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  // All hooks and state declarations first
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Set up form
  const form = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      username: '',
      role: 'admin',
    },
  });
  
  // Fetch users query
  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    enabled: !!user && isSuperAdmin,
  });

  // Add admin user mutation
  const addAdminMutation = useMutation({
    mutationFn: async (data: AddAdminFormValues) => {
      return apiRequest('POST', '/api/users/promote', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Admin Added',
        description: 'The user has been granted admin access',
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add admin user. Please verify the username and try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      console.log(`[FRONTEND] Attempting to update user ${userId} to role: ${role}`);
      const result = await apiRequest('PATCH', `/api/users/${userId}`, { role });
      console.log(`[FRONTEND] API call result:`, result);
      return result;
    },
    onSuccess: async (data, variables) => {
      // Add a small delay to ensure backend has processed the change
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force a complete refresh of the users data
      queryClient.removeQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Force a manual refetch after a moment
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/users'] });
      }, 300);
      
      toast({
        title: 'User Updated',
        description: 'The user\'s admin status has been updated',
      });
      
      // Force a HARD page reload to completely refresh the application
      // This ensures all components properly reflect the current user role
      if (user?.id === variables.userId) {
        // If the current user's role was changed, we'll do a complete reset
        if (user) {
          const updatedUser = {...user, role: variables.role};
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          
          // FORCE LOGOUT AND CLEAR EVERYTHING
          toast({
            title: 'Role Changed',
            description: 'Your role has been changed. You will be logged out for the changes to take effect.',
            variant: 'default'
          });
          
          // Wait 2 seconds then logout completely
          setTimeout(() => {
            localStorage.clear(); // Clear all localStorage
            window.location.href = '/'; // Go back to homepage/login
          }, 2000);
        }
      } else {
        // If changing another user's role, set a visual notification
        toast({
          title: 'Role Updated',
          description: 'The user\'s role has been updated successfully. Changes will take effect when they next log in.',
          variant: 'default'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/users/admin/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Admin Removed',
        description: 'The user\'s admin access has been removed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove admin access. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Helper functions (not hooks)
  const handleAddAdminButtonClick = () => {
    setIsOpen(true);
  };

  const onSubmit = (data: AddAdminFormValues) => {
    addAdminMutation.mutate(data);
  };

  const handleToggleAdmin = (userObj: UserType) => {
    // Don't allow changing superadmin roles for regular admins
    // Only superadmins can affect other superadmins
    if (!user || (user.role !== 'superadmin' && userObj.role === 'superadmin')) {
      toast({
        title: "Permission Denied",
        description: "Only superadmins can modify superadmin roles",
        variant: "destructive"
      });
      return;
    }
    
    if (userObj.role === 'admin' || userObj.role === 'superadmin') {
      toggleAdminMutation.mutate({ userId: userObj.id, role: 'user' });
    } else {
      toggleAdminMutation.mutate({ userId: userObj.id, role: 'admin' });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // We've already handled access control at the top of the component
  // No need for this extra check

  // Main render for super admin users
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manage Users</h1>
          <p className="text-gray-600">Manage user access and permissions</p>
        </div>
        <Button 
          className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
          onClick={handleAddAdminButtonClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>
      
      <div className="bg-white border border-[hsl(var(--msneutral-medium))] rounded-lg overflow-hidden mb-8">
        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[hsl(var(--msneutral-light))]">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Access</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) && users
                  .filter(userObj => userObj.role === 'admin' || userObj.role === 'superadmin')
                  .map((userObj: UserType) => (
                  <TableRow key={userObj.id} className="hover:bg-[hsl(var(--msneutral-light))]">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-[hsl(var(--msblue-accent))] rounded-full flex items-center justify-center text-white">
                          <span>{getInitials(userObj.displayName)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userObj.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        userObj.role === 'superadmin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userObj.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {userObj.lastLogin ? format(new Date(userObj.lastLogin), 'MMM d, yyyy') : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-center">
                      {/* Super Admin User - Show Demote and Remove */}
                      {userObj.role === 'superadmin' ? (
                        <>
                          <Button 
                            variant="ghost" 
                            onClick={() => toggleAdminMutation.mutate({ userId: userObj.id, role: 'admin' })} 
                            className="text-amber-600 hover:text-amber-800 hover:bg-transparent mr-2"
                            disabled={toggleAdminMutation.isPending || removeAdminMutation.isPending || (user?.role !== 'superadmin')}
                          >
                            Demote
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => toggleAdminMutation.mutate({ userId: userObj.id, role: 'user' })} 
                            className="text-red-600 hover:text-red-800 hover:bg-transparent"
                            disabled={toggleAdminMutation.isPending || removeAdminMutation.isPending || (user?.role !== 'superadmin')}
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        /* Regular Admin User - Show Promote and Remove */
                        <>
                          {user?.role === 'superadmin' && (
                            <Button 
                              variant="ghost" 
                              onClick={() => toggleAdminMutation.mutate({ userId: userObj.id, role: 'superadmin' })} 
                              className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] hover:bg-transparent mr-2"
                              disabled={toggleAdminMutation.isPending || removeAdminMutation.isPending}
                            >
                              Promote
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            onClick={() => toggleAdminMutation.mutate({ userId: userObj.id, role: 'user' })} 
                            className="text-red-600 hover:text-red-800 hover:bg-transparent"
                            disabled={toggleAdminMutation.isPending || removeAdminMutation.isPending}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promote User</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username (e.g. tsd_supervisor)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[hsl(var(--msblue-primary))] hover:bg-[hsl(var(--msblue-secondary))]"
                  disabled={addAdminMutation.isPending}
                >
                  {addAdminMutation.isPending ? 'Promoting...' : 'Promote User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;