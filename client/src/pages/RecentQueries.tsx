import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, SortDesc, SortAsc } from 'lucide-react';
import ConversationsList from '@/components/ConversationsList';
import { Context, Query } from '@shared/schema';
import { useAuth } from '@/components/AuthProvider';

const RecentQueries: React.FC = () => {
  const { user } = useAuth();
  const [contextMap, setContextMap] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);

  // Fetch contexts
  const { data: contexts = [] } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
    enabled: !!user,
  });

  // Fetch all queries
  const { data: queries = [] } = useQuery<Query[]>({
    queryKey: ['/api/queries'],
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

  // Filter and sort queries based on user selections
  useEffect(() => {
    if (!queries) return;

    let filtered = [...queries];

    // Filter by search term
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.query.toLowerCase().includes(lowerSearchQuery) || 
        (q.response && q.response.toLowerCase().includes(lowerSearchQuery))
      );
    }

    // Filter by context
    if (selectedContext !== 'all') {
      const contextId = parseInt(selectedContext);
      filtered = filtered.filter(q => q.contextId === contextId);
    }

    // Sort by date
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredQueries(filtered);
  }, [queries, searchQuery, selectedContext, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Recent Queries</h1>
        <p className="text-gray-600">View your recent interactions with the assistant</p>
      </div>
      
      {/* Filter and Sort Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search in Queries
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search in queries and responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Context Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Context
              </label>
              <Select value={selectedContext} onValueChange={setSelectedContext}>
                <SelectTrigger>
                  <SelectValue placeholder="All Contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  {contexts?.map((context) => (
                    <SelectItem key={context.id} value={context.id.toString()}>
                      {context.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'newest' ? (
                  <>
                    Newest First <SortDesc className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Oldest First <SortAsc className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredQueries.length} {filteredQueries.length === 1 ? 'result' : 'results'}
        {searchQuery && <span> for "{searchQuery}"</span>}
        {selectedContext !== 'all' && <span> in {contextMap[parseInt(selectedContext)]}</span>}
      </div>
      
      {/* Conversations List */}
      {filteredQueries.length > 0 ? (
        <ConversationsList 
          queries={filteredQueries}
          contextMap={contextMap}
        />
      ) : (
        <div className="bg-[hsl(var(--msneutral-light))] p-6 rounded-lg text-center">
          <p>No conversations found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default RecentQueries;
