import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Context } from '@shared/schema';

interface ChatInputProps {
  contextId: number | null;
  onSubmit: (query: string, response: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ contextId, onSubmit }) => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    if (!contextId) {
      toast({
        title: 'No context selected',
        description: 'Please select a context before asking a question',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('=== SUBMITTING QUERY ===');
      console.log('Context ID being used:', contextId);
      console.log('Query text:', query.trim());
      
      // Validate that the context ID exists by checking with server
      try {
        const contextResponse = await fetch(`/api/contexts/${contextId}`, {
          headers: {
            'x-user-id': JSON.parse(localStorage.getItem('currentUser') || '{}').id?.toString() || '',
            'x-user-role': JSON.parse(localStorage.getItem('currentUser') || '{}').role || 'user',
          }
        });
        if (!contextResponse.ok) {
          console.error('ERROR: Context ID does not exist on server!', contextId);
          toast({
            title: 'Invalid Context',
            description: 'The selected context no longer exists. Please refresh and select a valid context.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('ERROR: Could not validate context:', error);
        toast({
          title: 'Error',
          description: 'Could not validate context. Please try again.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiRequest('POST', '/api/query', {
        contextId,
        query: query.trim(),
      });
      
      console.log('Query response status:', response.status);
      const result = await response.json();
      console.log('Query result:', result);
      onSubmit(query, result.response);
      setQuery('');
    } catch (error) {
      console.error('Error submitting query:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
      <Input
        type="text"
        placeholder="Ask a question about your selected context..."
        className="flex-1 px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--msblue-primary))] rounded-l-md rounded-r-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isSubmitting}
      />
      <Button 
        type="submit" 
        className="bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white px-6 py-3 rounded-l-none rounded-r-md font-semibold"
        disabled={isSubmitting || !query.trim()}
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {isSubmitting ? 'Thinking...' : 'Ask'}
      </Button>
    </form>
  );
};

export default ChatInput;
