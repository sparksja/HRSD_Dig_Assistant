import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface SavedConversation {
  id: number;
  title: string;
  userId: number;
  contextId: number;
  contextName: string;
  messages: {query: string, response: string, timestamp: Date}[];
  createdAt: string;
}

const SavedResponses: React.FC = () => {
  const { user } = useAuth();
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [expandedConversation, setExpandedConversation] = useState<number | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [contextFilter, setContextFilter] = useState<string>('all');

  useEffect(() => {
    // Load saved conversations from localStorage
    const loadSavedConversations = () => {
      const saved = JSON.parse(localStorage.getItem('savedConversations') || '[]');
      // Filter by current user
      const userConversations = saved.filter((conv: SavedConversation) => conv.userId === user?.id);
      setSavedConversations(userConversations);
    };

    if (user) {
      loadSavedConversations();
    }
  }, [user]);

  // Get unique contexts for filter dropdown
  const uniqueContexts = useMemo(() => {
    const contexts = savedConversations.map(conv => conv.contextName);
    return [...new Set(contexts)].sort();
  }, [savedConversations]);

  // Filter conversations based on date range and context
  const filteredConversations = useMemo(() => {
    return savedConversations.filter(conv => {
      // Date range filter
      const convDate = new Date(conv.createdAt);
      
      if (startDateFilter) {
        const startDate = new Date(startDateFilter);
        startDate.setHours(0, 0, 0, 0); // Start of day
        if (convDate < startDate) return false;
      }
      
      if (endDateFilter) {
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (convDate > endDate) return false;
      }
      
      // Context filter
      if (contextFilter !== 'all' && conv.contextName !== contextFilter) {
        return false;
      }
      
      return true;
    });
  }, [savedConversations, startDateFilter, endDateFilter, contextFilter]);

  const deleteConversation = (id: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent expanding when deleting
    const saved = JSON.parse(localStorage.getItem('savedConversations') || '[]');
    const updated = saved.filter((conv: SavedConversation) => conv.id !== id);
    localStorage.setItem('savedConversations', JSON.stringify(updated));
    setSavedConversations(prev => prev.filter(conv => conv.id !== id));
  };

  const toggleConversation = (id: number) => {
    setExpandedConversation(expandedConversation === id ? null : id);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Saved Conversations</h1>
        <p className="text-gray-600">Click on any conversation to view the full chat</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>
        
        <div className="flex gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">From:</span>
            <Input
              type="date"
              placeholder="Start date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-40"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">To:</span>
            <Input
              type="date"
              placeholder="End date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-40"
            />
          </div>
          
          <div>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All contexts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contexts</SelectItem>
                {uniqueContexts.map((context) => (
                  <SelectItem key={context} value={context}>
                    {context}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(startDateFilter || endDateFilter || contextFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
                setContextFilter('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
      
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {savedConversations.length === 0 ? 'No saved conversations' : 'No conversations match your filters'}
          </h3>
          <p className="text-gray-500">
            {savedConversations.length === 0 
              ? 'Start a conversation and save it to see it here'
              : 'Try adjusting your filters to see more results'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="bg-white border rounded-lg overflow-hidden">
              {/* Compact conversation row */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleConversation(conversation.id)}
              >
                <div className="flex-1 flex items-center space-x-4">
                  {/* Date - First column */}
                  <div className="text-sm text-gray-500 w-24 flex-shrink-0">
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </div>
                  
                  {/* Context - Second column, wider to fit 50 characters */}
                  <div className="text-sm text-gray-600 w-80 flex-shrink-0 break-words">
                    {truncateText(conversation.contextName, 50)}
                  </div>
                  
                  {/* Question - Third column, takes remaining space */}
                  <div className="flex-1 font-medium text-gray-900 min-w-0">
                    {truncateText(conversation.messages[0]?.query || conversation.title, 80)}
                  </div>
                  
                  {/* Actions - Last column */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {expandedConversation === conversation.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                    <Button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded conversation content */}
              {expandedConversation === conversation.id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {conversation.messages.map((message, index) => (
                      <div key={index} className="space-y-2">
                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="bg-[hsl(var(--msblue-primary))] text-white p-3 rounded-lg max-w-[80%]">
                            {message.query}
                          </div>
                        </div>
                        
                        {/* Assistant response */}
                        <div className="flex justify-start">
                          <div className="bg-[#1CAE5F] text-white p-3 rounded-lg max-w-[80%] shadow-sm">
                            {message.response}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedResponses;
