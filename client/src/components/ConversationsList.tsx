import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Query } from '@shared/schema';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { MessageSquare, BookmarkPlus, BookmarkMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface ConversationsListProps {
  queries: Query[];
  contextMap: Record<number, string>;
  limit?: number;
  showViewAll?: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  queries,
  contextMap,
  limit,
  showViewAll = false
}) => {
  const { toast } = useToast();
  
  // Group queries by date (YYYY-MM-DD)
  const groupedQueries = queries.reduce((acc, query) => {
    const date = new Date(query.timestamp);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(query);
    return acc;
  }, {} as Record<string, Query[]>);
  
  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedQueries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Apply limit if specified
  const displayDates = limit ? sortedDates.slice(0, Math.min(limit, sortedDates.length)) : sortedDates;
  
  const handleSaveQuery = async (queryId: number, isSaved: boolean) => {
    try {
      await apiRequest('PATCH', `/api/queries/${queryId}`, {
        isSaved: !isSaved
      });
      
      // Invalidate queries cache
      queryClient.invalidateQueries({ queryKey: ['/api/queries'] });
      
      toast({
        title: !isSaved ? 'Conversation saved' : 'Conversation unsaved',
        description: !isSaved ? 'Conversation has been added to saved items' : 'Conversation has been removed from saved items',
      });
    } catch (error) {
      console.error('Error saving query:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the conversation',
        variant: 'destructive',
      });
    }
  };

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No conversations found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grouped conversations by date */}
      {displayDates.map(dateKey => (
        <div key={dateKey} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500">
            {format(new Date(dateKey), 'MMMM d, yyyy')}
          </h3>
          
          <div className="space-y-3">
            {groupedQueries[dateKey].map(query => (
              <Card key={query.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <Link href={`/recent/${query.id}`} className="text-md font-medium hover:text-[hsl(var(--msblue-primary))]">
                          {query.query.length > 60 ? `${query.query.substring(0, 60)}...` : query.query}
                        </Link>
                      </div>
                      
                      <div className="text-sm text-gray-500 flex items-center space-x-3">
                        <span>{contextMap[query.contextId] || 'Unknown context'}</span>
                        <span>•</span>
                        <span>{format(new Date(query.timestamp), 'h:mm a')}</span>
                      </div>
                      
                      {/* Display the conversation as a chat thread */}
                      <div className="mt-2 space-y-2">
                        {/* User query */}
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-[hsl(var(--msblue-primary))] flex items-center justify-center text-white text-xs font-bold">
                            U
                          </div>
                          <div className="text-sm text-gray-800 bg-[hsl(var(--msneutral-light))] p-2 rounded-md max-w-[90%]">
                            {query.query}
                          </div>
                        </div>
                        
                        {/* Assistant response */}
                        {query.response && (
                          <div className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                              A
                            </div>
                            <div className="text-sm text-gray-800 bg-white border border-gray-200 p-3 rounded-md max-w-[90%] whitespace-pre-wrap">
                              {query.response}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSaveQuery(query.id, query.isSaved)}
                      className="text-gray-400 hover:text-[hsl(var(--msblue-primary))] p-1 rounded-full hover:bg-gray-100"
                      title={query.isSaved ? "Remove from saved" : "Save conversation"}
                    >
                      {query.isSaved 
                        ? <BookmarkMinus className="h-5 w-5" /> 
                        : <BookmarkPlus className="h-5 w-5" />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {showViewAll && queries.length > (limit || 0) && (
        <div className="text-center pt-2">
          <Link 
            href="/recent" 
            className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] text-sm font-semibold"
          >
            View all conversations →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;