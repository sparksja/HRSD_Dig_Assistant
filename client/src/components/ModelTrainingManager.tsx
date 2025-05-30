import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelTrainingManagerProps {
  contextId: number;
  contextName: string;
}

interface TrainingStatus {
  trained: boolean;
  lastTrainingDate: string | null;
  documentCount: number;
  needsRetraining: boolean;
}

const ModelTrainingManager: React.FC<ModelTrainingManagerProps> = ({ contextId, contextName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmingRetrain, setIsConfirmingRetrain] = useState(false);
  
  // Fetch training status
  const { data: status, isLoading, error } = useQuery<TrainingStatus>({
    queryKey: ['/api/model/training-status', contextId],
    queryFn: () => apiRequest(`/api/model/training-status/${contextId}`),
  });
  
  // Mutation for triggering model training
  const trainMutation = useMutation({
    mutationFn: () => apiRequest('/api/model/train', {
      method: 'POST',
      body: JSON.stringify({ contextId }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Training initiated",
        description: `The Llama model for "${contextName}" is now being trained with the latest documents.`,
      });
      // Invalidate status query to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/model/training-status', contextId] });
      setIsConfirmingRetrain(false);
    },
    onError: () => {
      toast({
        title: "Training failed",
        description: "An error occurred while trying to train the model. Please try again.",
        variant: "destructive"
      });
      setIsConfirmingRetrain(false);
    }
  });
  
  const handleTrainClick = () => {
    setIsConfirmingRetrain(true);
  };
  
  const handleConfirmTraining = () => {
    trainMutation.mutate();
  };
  
  const handleCancelTraining = () => {
    setIsConfirmingRetrain(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Training Status</CardTitle>
          <CardDescription>Loading training information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Training Status</CardTitle>
          <CardDescription>Unable to retrieve training information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p>Error loading training status. Please refresh and try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = status?.lastTrainingDate 
    ? format(new Date(status.lastTrainingDate), 'MMMM d, yyyy') 
    : 'Never';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Model Training Status
          {status?.needsRetraining && (
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
              Needs Update
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage the Llama model training for this context
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Last Trained</p>
              <p className="mt-1">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Documents Processed</p>
              <p className="mt-1">{status?.documentCount || 0}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="mt-1 flex items-center">
              {status?.trained ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              )}
              <p>
                {status?.trained 
                  ? status.needsRetraining
                    ? "Trained, but automatic annual retraining is due" 
                    : "Model is up to date"
                  : "Model has not been trained yet"
                }
              </p>
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              The model is automatically retrained once per year. You can also manually retrain it if documents have been updated.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConfirmingRetrain ? (
          <>
            <p className="text-sm text-gray-500">Are you sure you want to retrain the model?</p>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancelTraining} disabled={trainMutation.isPending}>Cancel</Button>
              <Button onClick={handleConfirmTraining} disabled={trainMutation.isPending}>
                {trainMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">{
              status?.needsRetraining 
                ? "Model retraining is recommended" 
                : "Model retraining is optional"
            }</p>
            <Button 
              onClick={handleTrainClick} 
              disabled={trainMutation.isPending}
            >
              {trainMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  {status?.trained ? "Retrain Model" : "Train Model"}
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ModelTrainingManager;