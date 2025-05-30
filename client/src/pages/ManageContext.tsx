import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, RefreshCw, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Context, insertContextSchema, NamingConvention, InsertNamingConvention } from '@shared/schema';

// Component to display file count for a context
const FileCountDisplay: React.FC<{ contextId: number }> = ({ contextId }) => {
  const { data: fileData } = useQuery({
    queryKey: [`/api/contexts/${contextId}/file-count`],
    enabled: !!contextId,
  });

  const count = fileData?.documentCount || 0;
  return <span>{count} files</span>;
};
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Extend the context schema with validation
const formSchema = insertContextSchema.extend({
  sharePointUrl: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  customName: z.string().min(1, 'Context name is required').regex(/^[A-Z0-9]+$/, 'Must be alphanumeric with no spaces or symbols'),
}).refine((data) => {
  // If no source is provided, require SharePoint URL
  return data.sharePointUrl || true; // We'll validate this based on sourceType in the component
}, {
  message: "Either SharePoint URL or uploaded files are required",
  path: ["sharePointUrl"],
});

type FormValues = z.infer<typeof formSchema>;

const ManageContext: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContext, setCurrentContext] = useState<Context | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<Context | null>(null);
  const [trainDialogOpen, setTrainDialogOpen] = useState(false);
  const [contextToTrain, setContextToTrain] = useState<Context | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [department, setDepartment] = useState('');
  const [division, setDivision] = useState('');
  const [section, setSection] = useState('');
  const [deleteNamingDialogOpen, setDeleteNamingDialogOpen] = useState(false);
  const [namingConventionToDelete, setNamingConventionToDelete] = useState<{id: number, value: string, type: string} | null>(null);
  const [sourceType, setSourceType] = useState<'sharepoint' | 'upload'>('sharepoint');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [viewDocsContext, setViewDocsContext] = useState<Context | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);

  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      sharePointUrl: '',
      customName: '',
    },
  });

  // Fetch contexts
  const { data: contexts = [], isLoading } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
    enabled: !!user && isAdmin,
  });
  
  // Fetch naming conventions
  const { data: namingConventions = [] } = useQuery<NamingConvention[]>({
    queryKey: ['/api/naming-conventions'],
    enabled: !!user && isAdmin,
  });

  // Fetch existing files for edit mode
  const { data: existingFiles = [] } = useQuery<string[]>({
    queryKey: ['/api/contexts', currentContext?.id, 'files'],
    queryFn: async () => {
      if (!currentContext?.id) return [];
      console.log('Fetching files for context:', currentContext.id);
      const response = await fetch(`/api/contexts/${currentContext.id}/files`, {
        headers: {
          'x-user-id': '4',
          'x-user-role': 'superadmin'
        }
      });
      if (!response.ok) {
        console.log('Failed to fetch files:', response.status);
        return [];
      }
      const data = await response.json();
      console.log('Files response:', data);
      return data.files || [];
    },
    enabled: !!currentContext?.id && isEditMode && sourceType === 'upload',
  });
  
  // Save naming convention mutation
  const saveNamingConventionMutation = useMutation({
    mutationFn: async (data: {
      department: string;
      division: string | null;
      section: string | null;
      createdBy: number | null;
    }) => {
      // Client-side permission check
      if (!isAdmin) {
        throw new Error("Admin access required");
      }
      
      return apiRequest('POST', '/api/naming-conventions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/naming-conventions'] });
      toast({
        title: 'Naming Convention Saved',
        description: `The naming convention has been saved successfully.`,
      });
      
      // Clear form fields after successful save
      setDepartment('');
      setDivision('');
      setSection('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save naming convention',
        variant: 'destructive',
      });
    },
  });

  // Add context mutation
  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('POST', '/api/contexts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context Added',
        description: 'The context has been successfully created',
      });
    },
    onError: (error: any) => {
      console.log('Add context error:', error);
      const errorMessage = error?.message || 'Failed to add context. Please try again.';
      console.log('Error message:', errorMessage);
      
      // Check for duplicate name error
      if (errorMessage.includes('already exists')) {
        toast({
          title: 'Error',
          description: 'A context with this name already exists. Please choose a different name.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // Edit context mutation
  const editMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      return apiRequest('PATCH', `/api/contexts/${data.id}`, {
        name: data.name,
        description: data.description,
        sharePointUrl: data.sharePointUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context Updated',
        description: 'The context has been successfully updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update context. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete context mutation
  const deleteMutation = useMutation({
    mutationFn: async (contextId: number) => {
      return apiRequest('DELETE', `/api/contexts/${contextId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context Deleted',
        description: 'The context has been successfully deleted',
      });
      setDeleteDialogOpen(false);
      setContextToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete context. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Train model mutation
  const trainModelMutation = useMutation({
    mutationFn: async (contextId: number) => {
      return apiRequest('POST', '/api/model/train', { contextId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Model Training Started',
        description: 'The Llama model is now being trained with your document context. This may take some time.',
      });
      setTrainDialogOpen(false);
      setContextToTrain(null);
      setIsTraining(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to start model training. Please try again.',
        variant: 'destructive',
      });
      setIsTraining(false);
    },
  });

  // Delete naming convention mutation
  const deleteNamingConventionMutation = useMutation({
    mutationFn: async (id: number) => {
      const convention = namingConventions.find(c => c.id === id);
      
      // Special handling for section deletions
      if (namingConventionToDelete?.type === 'section') {
        if (convention && convention.department && convention.division) {
          // Check if a record with just department and division already exists
          const existingRecord = namingConventions.find(c => 
            c.department === convention.department && 
            c.division === convention.division && 
            !c.section &&
            c.id !== id
          );
          
          // First delete the old record
          await apiRequest('DELETE', `/api/naming-conventions/${id}`);
          
          // Only create a new record if one doesn't already exist
          if (!existingRecord) {
            return apiRequest('POST', '/api/naming-conventions', {
              department: convention.department,
              division: convention.division,
              section: null,
              createdBy: user?.id || null
            });
          }
        }
      }
      
      // Special handling for division deletions
      if (namingConventionToDelete?.type === 'division') {
        if (convention && convention.department) {
          // Check if a record with just department already exists
          const existingRecord = namingConventions.find(c => 
            c.department === convention.department && 
            !c.division &&
            !c.section &&
            c.id !== id
          );
          
          // First delete the old record
          await apiRequest('DELETE', `/api/naming-conventions/${id}`);
          
          // Only create a new record if one doesn't already exist
          if (!existingRecord) {
            return apiRequest('POST', '/api/naming-conventions', {
              department: convention.department,
              division: null,
              section: null,
              createdBy: user?.id || null
            });
          }
        }
      }
      
      // For department deletions, just delete normally
      return apiRequest('DELETE', `/api/naming-conventions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/naming-conventions'] });
      toast({
        title: 'Success',
        description: 'Naming convention deleted successfully!',
      });
      setDeleteNamingDialogOpen(false);
      setNamingConventionToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete naming convention.',
        variant: 'destructive',
      });
    },
  });

  // Watch for changes in custom name field
  const customName = form.watch('customName');

  // Auto-update form name field when dropdown selections or custom name changes
  React.useEffect(() => {
    let prefix = '';
    if (department) prefix += department;
    if (division) prefix += `-${division}`;
    if (section) prefix += `-${section}`;
    
    const fullName = prefix && customName ? `${prefix}-${customName}` : prefix || customName || '';
    form.setValue('name', fullName);
  }, [department, division, section, customName, form]);

  // Check permission - both Admin and Super Admin can access this page
  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleAddButtonClick = () => {
    setIsEditMode(false);
    setCurrentContext(null);
    // Generate a prefix from department, division, section
    const prefix = generatePrefix();
    form.reset({
      name: prefix,
      description: '',
      sharePointUrl: '',
    });
    setIsOpen(true);
  };

  const handleEditButtonClick = (context: Context) => {
    setIsEditMode(true);
    setCurrentContext(context);
    form.reset({
      name: context.name,
      description: context.description || '',
      sharePointUrl: context.sharePointUrl,
    });
    setIsOpen(true);
  };

  const handleDeleteButtonClick = (context: Context) => {
    setContextToDelete(context);
    setDeleteDialogOpen(true);
  };
  
  const handleTrainModelClick = (context: Context) => {
    setContextToTrain(context);
    setTrainDialogOpen(true);
  };

  const handleViewDocs = (context: Context) => {
    setViewDocsContext(context);
    setDocsDialogOpen(true);
  };

  // Query for file data when viewing docs
  const { data: docsFileData } = useQuery({
    queryKey: [`/api/contexts/${viewDocsContext?.id}/file-count`],
    enabled: !!viewDocsContext?.id && docsDialogOpen,
  });

  const onSubmit = async (data: FormValues) => {
    // Check for duplicate names FIRST (frontend validation)
    const existingContext = contexts.find(ctx => 
      ctx.name.toLowerCase() === data.name.toLowerCase() && 
      (!isEditMode || ctx.id !== currentContext?.id)
    );
    
    if (existingContext) {
      form.setError('name', { message: 'A context with this name already exists' });
      toast({
        title: 'Error',
        description: 'A context with this name already exists. Please choose a different name.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate based on source type
    if (sourceType === 'sharepoint' && !data.sharePointUrl) {
      form.setError('sharePointUrl', { message: 'SharePoint URL is required' });
      return;
    }
    if (sourceType === 'upload' && uploadedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload at least one file',
        variant: 'destructive',
      });
      return;
    }

    // Close popup immediately when form is valid
    setIsOpen(false);
    form.reset();
    setUploadedFiles([]);

    // Show processing status
    toast({
      title: isEditMode ? 'Updating Context' : 'Creating Context',
      description: 'Processing your request...',
    });

    // Remove customName from the data before sending to API
    const { customName, ...contextData } = data;
    
    // For file uploads, we need to handle files differently
    if (sourceType === 'upload') {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', contextData.name);
      formData.append('description', contextData.description || '');
      formData.append('createdBy', String(user?.id || 1));
      
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });

      try {
        // Use consistent authentication headers like other API calls
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const headers: Record<string, string> = {};
        
        // Add user ID and role from local storage if available
        if (currentUser?.id) {
          headers['x-user-id'] = currentUser.id.toString();
          headers['x-user-role'] = currentUser.role || 'user';
        } else {
          // Fallback for authenticated admin users - use dig_water_eng credentials
          headers['x-user-id'] = '4';
          headers['x-user-role'] = 'superadmin';
        }

        console.log('Upload attempt with headers:', headers);
        console.log('FormData contents:', {
          name: formData.get('name'),
          description: formData.get('description'),
          files: uploadedFiles.length
        });

        if (isEditMode && currentContext) {
          // For editing, we'll use a different endpoint
          const response = await fetch(`/api/contexts/${currentContext.id}/upload`, {
            method: 'PATCH',
            body: formData,
            headers,
            credentials: 'include',
          });
          
          console.log('Edit response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Edit upload failed:', errorText);
            throw new Error(`Upload failed: ${response.status}`);
          }
        } else {
          // For creating new context with files
          const response = await fetch('/api/contexts/upload', {
            method: 'POST',
            body: formData,
            headers,
            credentials: 'include',
          });
          
          console.log('Create response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Create upload failed:', errorText);
            
            // Check for duplicate name error
            console.log('Upload failed with status:', response.status);
            console.log('Error response:', errorText);
            if (response.status === 400) {
              setIsOpen(true); // Reopen the dialog so user can fix the name
              let errorMessage = 'Upload failed. Please try again.';
              
              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
              } catch {
                if (errorText.includes('already exists')) {
                  errorMessage = 'A context with this name already exists. Please choose a different name.';
                } else {
                  errorMessage = errorText;
                }
              }
              
              toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
              });
              return;
            }
            
            throw new Error(`Upload failed: ${response.status}`);
          }
        }
        
        // Refresh the contexts list everywhere 
        await queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
        await queryClient.refetchQueries({ queryKey: ['/api/contexts'] });
        
        toast({
          title: 'Success',
          description: isEditMode ? 'Context updated successfully' : 'Context created successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to upload files. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Handle SharePoint URL submission as before
      if (isEditMode && currentContext) {
        editMutation.mutate({ ...contextData, customName: '', id: currentContext.id });
      } else {
        addMutation.mutate({ ...contextData, customName: '' });
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (contextToDelete) {
      deleteMutation.mutate(contextToDelete.id);
    }
  };
  
  const handleTrainModelConfirm = () => {
    if (contextToTrain) {
      setIsTraining(true);
      trainModelMutation.mutate(contextToTrain.id);
    }
  };
  
  // Generate prefix from department, division, section
  const generatePrefix = () => {
    let prefix = '';
    if (department) prefix += department.toUpperCase() + '-';
    if (division) prefix += division.toUpperCase() + '-';
    if (section) prefix += section.toUpperCase() + '-';
    return prefix.length > 0 ? prefix : '';
  };
  
  // Update the form's name field when department/division/section changes
  React.useEffect(() => {
    if (!isEditMode) {
      const prefix = generatePrefix();
      const currentName = form.getValues('name');
      // Only prepend the prefix if the name doesn't already start with it
      if (prefix && !currentName.startsWith(prefix)) {
        form.setValue('name', prefix + currentName);
      }
    }
  }, [department, division, section, isOpen, isEditMode]);

  return (
    <div>
      {/* Context Naming Section */}
      <div className="bg-white border border-[hsl(var(--msneutral-medium))] rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Context Naming</h2>
        <p className="text-sm text-gray-600 mb-4">Define department, division, and work center abbreviations to use as prefixes when creating new contexts</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="department-input" className="text-sm font-medium">Department</Label>
            <Input
              id="department-input"
              placeholder="5 chars max" 
              maxLength={5}
              value={department}
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                setDepartment(value);
              }}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Department abbreviation (max 5 chars)</p>
            <div className="text-xs mt-1 flex flex-wrap gap-1">
              {namingConventions
                .map(c => c.department)
                .filter((value, index, self) => 
                  value && self.indexOf(value) === index
                )
                .map((dept, idx) => (
                  <div 
                    key={idx} 
                    className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs hover:bg-gray-200 group"
                  >
                    <span 
                      className="cursor-pointer"
                      onClick={() => {
                        setDepartment(dept || '');
                      }}
                    >
                      {dept}
                    </span>
                    <button
                      className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        const convention = namingConventions.find(c => c.department === dept);
                        if (convention) {
                          // Check if this department has divisions that depend on it
                          const hasDependentDivisions = namingConventions.some(c => 
                            c.department === dept && c.division && c.division !== dept
                          );
                          
                          if (hasDependentDivisions) {
                            toast({
                              title: "Cannot Delete",
                              description: `Cannot delete department "${dept}" because it has dependent divisions. Delete the divisions first.`,
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          setNamingConventionToDelete({
                            id: convention.id,
                            value: dept || '',
                            type: 'department'
                          });
                          setDeleteNamingDialogOpen(true);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div>
            <Label htmlFor="division-input" className="text-sm font-medium">Division</Label>
            <Input
              id="division-input"
              placeholder="5 chars max" 
              maxLength={5}
              value={division}
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                setDivision(value);
              }}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Division abbreviation (max 5 chars)</p>
            <div className="text-xs mt-1 flex flex-wrap gap-1">
              {department ? (
                namingConventions
                  .filter(c => c.department === department)
                  .map(c => c.division)
                  .filter((value, index, self) => 
                    value && self.indexOf(value) === index
                  )
                  .map((div, idx) => (
                    <div 
                      key={idx} 
                      className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs hover:bg-gray-200 group"
                    >
                      <span 
                        className="cursor-pointer"
                        onClick={() => {
                          setDivision(div || '');
                        }}
                      >
                        {div}
                      </span>
                      <button
                        className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const convention = namingConventions.find(c => c.department === department && c.division === div);
                          if (convention) {
                            // Check if this division has sections that depend on it
                            const hasDependentSections = namingConventions.some(c => 
                              c.department === department && c.division === div && c.section && c.section !== div
                            );
                            
                            if (hasDependentSections) {
                              toast({
                                title: "Cannot Delete",
                                description: `Cannot delete division "${div}" because it has dependent work centers. Delete the work centers first.`,
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            setNamingConventionToDelete({
                              id: convention.id,
                              value: div || '',
                              type: 'division'
                            });
                            setDeleteNamingDialogOpen(true);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
              ) : (
                <span className="text-gray-500 italic">Select a department first</span>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="section-input" className="text-sm font-medium">Work Center</Label>
            <Input
              id="section-input"
              placeholder="5 chars max" 
              maxLength={5}
              value={section}
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                setSection(value);
              }}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Work center abbreviation (max 5 chars)</p>
            <div className="text-xs mt-1 flex flex-wrap gap-1">
              {department && division ? (
                namingConventions
                  .filter(c => c.department === department && c.division === division)
                  .map(c => c.section)
                  .filter((value, index, self) => 
                    value && self.indexOf(value) === index
                  )
                  .map((sec, idx) => (
                    <div 
                      key={idx} 
                      className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs hover:bg-gray-200 group"
                    >
                      <span 
                        className="cursor-pointer"
                        onClick={() => {
                          setSection(sec || '');
                        }}
                      >
                        {sec}
                      </span>
                      <button
                        className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const convention = namingConventions.find(c => c.department === department && c.division === division && c.section === sec);
                          if (convention) {
                            setNamingConventionToDelete({
                              id: convention.id,
                              value: sec || '',
                              type: 'section'
                            });
                            setDeleteNamingDialogOpen(true);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
              ) : (
                <span className="text-gray-500 italic">
                  {!department ? "Select a department first" : "Select a division first"}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Current prefix box removed as requested */}
        
        <div className="flex justify-end mt-4">
          <Button 
            className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
            onClick={() => {
              if (department || division || section) {
                // Save the naming convention to the database
                const namingConventionData = {
                  department: department || 'HRSD', // Default if empty
                  division: division || null,
                  section: section || null,
                  createdBy: user?.id || null
                };
                
                // Call the mutation to save the naming convention
                saveNamingConventionMutation.mutate(namingConventionData);
              } else {
                toast({
                  title: "Error",
                  description: "Please enter at least one abbreviation.",
                  variant: "destructive"
                });
              }
            }}
          >
            Save Naming Convention
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manage Context</h1>
          <p className="text-gray-600">Add, edit, or remove context sources from SharePoint</p>
        </div>
        <Button 
          className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
          onClick={handleAddButtonClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Context
        </Button>
      </div>
      
      <div className="bg-white border border-[hsl(var(--msneutral-medium))] rounded-lg overflow-hidden mb-8">
        {isLoading ? (
          <div className="text-center py-8">Loading contexts...</div>
        ) : contexts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No contexts found. Add your first context to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[hsl(var(--msneutral-light))]">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">SharePoint URL</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Docs</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contexts.map((context: Context) => (
                  <TableRow key={context.id} className="hover:bg-[hsl(var(--msneutral-light))]">
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{context.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{context.sharePointUrl}</div>
                    </TableCell>
                    <TableCell>
                      {context.sharePointUrl ? (
                        <div className="text-sm text-gray-500">SharePoint</div>
                      ) : (
                        <button
                          onClick={() => handleViewDocs(context)}
                          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          <FileCountDisplay contextId={context.id} />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {context.lastUpdated ? format(new Date(context.lastUpdated), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        context.status === 'active'
                          ? 'bg-[hsl(var(--msstatus-success))] bg-opacity-10 text-[hsl(var(--msstatus-success))]'
                          : context.status === 'indexing'
                          ? 'bg-[hsl(var(--msstatus-warning))] bg-opacity-10 text-[hsl(var(--msstatus-warning))]'
                          : 'bg-[hsl(var(--msstatus-error))] bg-opacity-10 text-[hsl(var(--msstatus-error))]'
                      }`}>
                        {context.status === 'active' ? 'Active' : context.status === 'indexing' ? 'Indexing' : 'Error'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleEditButtonClick(context)}
                          className="text-[#2333A2] hover:text-[#1a2a8a] hover:bg-transparent"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => handleDeleteButtonClick(context)}
                          className="text-red-600 hover:text-red-700 hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1">Delete</span>
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => handleTrainModelClick(context)}
                          className="text-[#1CAE5F] hover:text-[#158a4f] hover:bg-transparent"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="ml-1">Rebuild DB</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Context Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Context' : 'Add New Context'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Department, Division, and Section in a three-column layout */}
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div>
                  <FormLabel htmlFor="department-input">Department</FormLabel>
                  <Select value={department} onValueChange={(value) => {
                    setDepartment(value);
                    setDivision(''); // Clear division when department changes
                    setSection(''); // Clear section when department changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(namingConventions as any[])
                        .map((c: any) => c.department)
                        .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i)
                        .map((dept: string) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <FormLabel htmlFor="division-input">Division</FormLabel>
                  <Select value={division} onValueChange={(value) => {
                    setDivision(value);
                    setSection(''); // Clear section when division changes
                  }} disabled={!department}>
                    <SelectTrigger>
                      <SelectValue placeholder={!department ? "Select department first" : "Select division"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(namingConventions as any[])
                        .filter((c: any) => c.department === department)
                        .map((c: any) => c.division)
                        .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i)
                        .map((div: string) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <FormLabel>Work Center</FormLabel>
                  <Select value={section} onValueChange={(value) => {
                    setSection(value);
                    form.setValue("section", value);
                  }} disabled={!division}>
                    <SelectTrigger>
                      <SelectValue placeholder={!division ? "Select division first" : "Select work center"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(namingConventions as any[])
                        .filter((c: any) => c.department === department && c.division === division)
                        .map((c: any) => c.section)
                        .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i)
                        .map((sec: string) => (
                          <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Naming Prefix</FormLabel>
                    <FormControl>
                      <Input 
                        value={(() => {
                          let prefix = '';
                          if (department) prefix += department;
                          if (division) prefix += `-${division}`;
                          if (section) prefix += `-${section}`;
                          return prefix || 'Select options above';
                        })()}
                        readOnly 
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="Select options above to generate prefix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="PROJECTNAME"
                        onChange={(e) => {
                          // Convert to uppercase and remove spaces
                          const value = e.target.value.toUpperCase().replace(/\s/g, '');
                          field.onChange(value);
                        }}
                        className={`font-mono ${form.formState.errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a name for this context (letters and numbers only, no spaces or symbols)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Source Type Selection */}
              <div className="mb-4">
                <FormLabel>Document Source</FormLabel>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSourceType('sharepoint')}
                    className={`flex-1 border-black ${sourceType === 'sharepoint' 
                      ? 'bg-[#1CAE5F] text-black hover:bg-[#1CAE5F] hover:text-black' 
                      : 'bg-white text-black hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    SharePoint URL
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSourceType('upload')}
                    className={`flex-1 border-black ${sourceType === 'upload' 
                      ? 'bg-[#1CAE5F] text-black hover:bg-[#1CAE5F] hover:text-black' 
                      : 'bg-white text-black hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    Upload Files
                  </Button>
                </div>
              </div>

              {/* SharePoint URL Input */}
              {sourceType === 'sharepoint' && (
                <>
                  <FormField
                    control={form.control}
                    name="sharePointUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SharePoint URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.sharepoint.com/sites/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Rebuild Frequency for SharePoint */}
                  <div className="mb-4">
                    <FormLabel>Rebuild Frequency (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        min="1" 
                        max="365"
                        defaultValue="30"
                        className="mt-1"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1">
                      How often the database should be automatically rebuilt (1-365 days)
                    </p>
                  </div>
                </>
              )}

              {/* File Upload Area */}
              {sourceType === 'upload' && (
                <div className="mb-4">
                  <FormLabel>Upload Documents</FormLabel>
                  
                  {/* Show existing files in edit mode */}
                  {isEditMode && existingFiles.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Existing Files ({existingFiles.length}):
                      </p>
                      <div className="space-y-1">
                        {existingFiles.map((fileName, index) => (
                          <div key={index} className="flex items-center text-sm text-blue-800">
                            <span className="truncate">{fileName}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        Upload new files below to add to existing files
                      </p>
                    </div>
                  )}
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      const files = Array.from(e.dataTransfer.files);
                      setUploadedFiles(prev => [...prev, ...files]);
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        setUploadedFiles(prev => [...prev, ...files]);
                      };
                      input.click();
                    }}
                  >
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-lg font-medium">Drop files here or click to browse</p>
                      <p className="text-sm">Supports PDF, Word, Excel, PowerPoint, and text files</p>
                    </div>
                  </div>
                  
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Uploaded Files ({uploadedFiles.length}):</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this context"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
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
                  className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
                  disabled={addMutation.isPending || editMutation.isPending}
                >
                  {addMutation.isPending || editMutation.isPending 
                    ? 'Saving...' 
                    : isEditMode ? 'Update Context' : 'Save Context'
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the context
              "{contextToDelete?.name}" and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Model Training Confirmation Dialog */}
      <AlertDialog open={trainDialogOpen} onOpenChange={setTrainDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Train Llama Model</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                You're about to train the Llama model with documents from the context "{contextToTrain?.name}".
              </p>
              <p className="mb-2">
                This process will:
              </p>
              <ul className="list-disc pl-6 mb-2 space-y-1">
                <li>Process all documents in this context</li>
                <li>Create embeddings for multi-modal content (.pdf, .docx, .xlsx, .csv files and images)</li>
                <li>Update the model's knowledge base for improved responses</li>
              </ul>
              <p>
                The training process may take several minutes depending on the size and number of documents.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTraining}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTrainModelConfirm}
              className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white hover:text-white"
              disabled={isTraining}
            >
              {isTraining ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                'Start Training'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Naming Convention Confirmation Dialog */}
      <AlertDialog open={deleteNamingDialogOpen} onOpenChange={setDeleteNamingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {namingConventionToDelete?.type} "{namingConventionToDelete?.value}" 
              from your saved naming conventions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (namingConventionToDelete) {
                  deleteNamingConventionMutation.mutate(namingConventionToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
            >
              {deleteNamingConventionMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Documents Dialog */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploaded Documents - {viewDocsContext?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {docsFileData?.files && Array.isArray(docsFileData.files) && docsFileData.files.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {docsFileData.files.map((file: any, index: number) => (
                  <div key={file.id || index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-600">
                        📄
                      </div>
                      <div>
                        <div className="font-medium">{file.name || `Document ${index + 1}`}</div>
                        <div className="text-sm text-gray-500">
                          {file.size ? `${Math.round(file.size / 1024)} KB` : ''} • {file.type || 'Document'}
                          {file.uploadDate && (
                            <span> • Uploaded {new Date(file.uploadDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const viewUrl = `/api/files/${viewDocsContext?.id}/${file.name}`;
                          window.open(viewUrl, '_blank');
                          toast({
                            title: "Opening File",
                            description: `Viewing ${file.name || 'document'}...`,
                          });
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const downloadUrl = `/api/files/${viewDocsContext?.id}/${file.name}?download=true`;
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = file.name || 'document';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast({
                            title: "Downloading File",
                            description: `Downloading ${file.name || 'document'}...`,
                          });
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No documents uploaded for this context.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageContext;
