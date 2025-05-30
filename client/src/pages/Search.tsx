import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { Context } from '@shared/schema';

interface SearchProps {
  selectedContext: Context | null;
}

const Search: React.FC<SearchProps> = ({ selectedContext }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    if (!selectedContext) {
      setResponseText('Please select a context from the dropdown menu first.');
      return;
    }
    
    setIsSearching(true);
    setResponseText('');
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          contextId: selectedContext.id
        }),
      });
      
      const result = await response.json();
      
      // Simply set the response text directly
      if (result && result.response) {
        setResponseText(result.response);
      } else if (typeof result === 'string') {
        setResponseText(result);
      } else {
        setResponseText('No response received');
      }
      
    } catch (error) {
      setResponseText('Error: Could not get response');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Search Documents</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask a question about your documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            Ask
          </Button>
        </div>
      </form>
      
      {isSearching && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p>Processing your question...</p>
        </div>
      )}
      
      {responseText && !isSearching && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Response:</h3>
          <p className="text-lg">{responseText}</p>
        </div>
      )}
    </div>
  );
};

export default Search;