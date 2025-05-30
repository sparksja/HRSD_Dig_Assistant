import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ChatInput from '@/components/ChatInput';
import { useToast } from '@/hooks/use-toast';
import { Context, Query } from '@shared/schema';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';

interface DashboardProps {
  selectedContext: Context | null;
  chatHistory: {query: string, response: string, timestamp: Date}[];
  onChatUpdate: (history: {query: string, response: string, timestamp: Date}[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedContext, chatHistory, onChatUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contextMap, setContextMap] = useState<Record<number, string>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch contexts
  const { data: contexts = [] } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
    enabled: !!user,
  });

  // Fetch recent queries
  const { 
    data: recentQueries = [],
    refetch: refetchQueries
  } = useQuery<Query[]>({
    queryKey: ['/api/queries/recent'],
    enabled: !!user,
  });

  useEffect(() => {
    if (contexts && contexts.length > 0) {      
      // Build context map for display in queries table
      const map: Record<number, string> = {};
      contexts.forEach((context: Context) => {
        map[context.id] = context.name;
      });
      setContextMap(map);
    }
  }, [contexts]);

  const handleQuerySubmit = async (query: string, response: string) => {
    // Add to chat history using the prop function
    onChatUpdate([...chatHistory, { query, response, timestamp: new Date() }]);
    
    toast({
      title: 'Query Submitted',
      description: 'Your question has been processed successfully',
    });
    
    // Refetch queries to show the new one
    refetchQueries();
  };

  const handleNewConversation = () => {
    if (chatHistory.length > 0) {
      setShowSaveDialog(true);
    } else {
      onChatUpdate([]);
    }
  };

  const handleSaveConversation = async () => {
    if (!user || !selectedContext || chatHistory.length === 0) return;
    
    // Generate a title from the first query
    const title = chatHistory[0]?.query.slice(0, 50) + (chatHistory[0]?.query.length > 50 ? '...' : '');
    
    // Save to localStorage for now (simple solution that works immediately)
    const savedConversations = JSON.parse(localStorage.getItem('savedConversations') || '[]');
    const newConversation = {
      id: Date.now(),
      title,
      userId: user.id,
      contextId: selectedContext.id,
      contextName: selectedContext.name,
      messages: chatHistory,
      createdAt: new Date().toISOString()
    };
    
    savedConversations.push(newConversation);
    localStorage.setItem('savedConversations', JSON.stringify(savedConversations));
    
    toast({
      title: 'Conversation Saved',
      description: 'Your conversation has been saved to Saved Conversations',
    });
    onChatUpdate([]);
    setShowSaveDialog(false);
  };

  const handleDiscardConversation = () => {
    onChatUpdate([]);
    setShowSaveDialog(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.username}</p>
      </div>
      
      {/* Chat Interface */}
      <div className="flex flex-col h-[600px] bg-white border rounded-lg">
        {/* Chat Header */}
        <div className="bg-[hsl(var(--action-primary))] text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Digital Assistant</h2>
            <p className="text-blue-100 text-sm">
              {selectedContext ? `Context: ${selectedContext.name}` : 'Please select a context from the dropdown'}
            </p>
          </div>
          {chatHistory.length > 0 && (
            <Button
              onClick={handleNewConversation}
              variant="outline"
              size="sm"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[hsl(var(--action-primary))]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          )}
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Start a conversation by asking a question below!</p>
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div key={index} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[hsl(var(--chat-question))] text-white rounded-lg px-4 py-2 max-w-[80%] shadow-sm">
                    <p>{chat.query}</p>
                    <p className="text-xs text-blue-100 mt-1">
                      {chat.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="bg-[hsl(var(--chat-answer))] text-white rounded-lg px-4 py-2 max-w-[80%] shadow-sm">
                    <p>{chat.response}</p>
                    <p className="text-xs text-green-100 mt-1">
                      Digital Assistant
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Chat Input */}
        <div className="border-t p-4">
          <ChatInput 
            contextId={selectedContext?.id || null}
            onSubmit={handleQuerySubmit}
          />
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Conversation?</h3>
            <p className="text-gray-600 mb-6">
              You have an ongoing conversation. Would you like to save it before starting a new one?
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleSaveConversation}
                className="flex-1 bg-[hsl(var(--action-primary))] hover:bg-[hsl(var(--action-primary-hover))] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save & New
              </Button>
              <Button
                onClick={handleDiscardConversation}
                variant="outline"
                className="flex-1"
              >
                Discard & New
              </Button>
              <Button
                onClick={() => setShowSaveDialog(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
