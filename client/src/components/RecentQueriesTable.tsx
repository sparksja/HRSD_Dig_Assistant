import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Query } from '@shared/schema';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface RecentQueriesTableProps {
  queries: Query[];
  contextMap: Record<number, string>;
  limit?: number;
  showViewAll?: boolean;
}

const RecentQueriesTable: React.FC<RecentQueriesTableProps> = ({
  queries,
  contextMap,
  limit,
  showViewAll = false
}) => {
  const { toast } = useToast();
  const displayQueries = limit ? queries.slice(0, limit) : queries;

  const handleSaveQuery = async (queryId: number, isSaved: boolean) => {
    try {
      await apiRequest('PATCH', `/api/queries/${queryId}`, {
        isSaved: !isSaved
      });
      
      // Invalidate queries cache
      queryClient.invalidateQueries({ queryKey: ['/api/queries'] });
      
      toast({
        title: !isSaved ? 'Query saved' : 'Query unsaved',
        description: !isSaved ? 'Query has been added to saved responses' : 'Query has been removed from saved responses',
      });
    } catch (error) {
      console.error('Error saving query:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the query',
        variant: 'destructive',
      });
    }
  };

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent queries found
      </div>
    );
  }

  return (
    <>
      <div className="border border-[hsl(var(--msneutral-medium))] rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[hsl(var(--msneutral-light))]">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Query</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Context</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayQueries.map((query) => (
                <TableRow 
                  key={query.id} 
                  className="hover:bg-[hsl(var(--msneutral-light))]"
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-gray-900">{query.query}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {contextMap[query.contextId] || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {query.timestamp 
                        ? format(new Date(query.timestamp), 'MMM d, yyyy')
                        : 'Unknown date'}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-[hsl(var(--msblue-primary))]">
                    <Link 
                      href={`/recent/${query.id}`} 
                      className="hover:text-[hsl(var(--msblue-secondary))] mr-3"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleSaveQuery(query.id, query.isSaved)}
                      className="hover:text-[hsl(var(--msblue-secondary))]"
                    >
                      {query.isSaved ? 'Unsave' : 'Save'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {showViewAll && (
          <div className="bg-white px-6 py-3 border-t border-[hsl(var(--msneutral-medium))]">
            <Link 
              href="/recent" 
              className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] text-sm font-semibold"
            >
              View all queries →
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default RecentQueriesTable;
