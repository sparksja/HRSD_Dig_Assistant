import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Context } from '@shared/schema';
import { Link } from 'wouter';
import { Search, Clock, Folder } from 'lucide-react';

interface DashboardCardsProps {
  currentContext: Context | null;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ currentContext }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card className="border-[hsl(var(--msneutral-medium))] hover:shadow-md transition duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Search Documents</h3>
            <Search className="text-[hsl(var(--msblue-primary))] h-5 w-5" />
          </div>
          <p className="text-gray-600 text-sm mb-4">Search through all documents in the current context</p>
          <Link href="/search" className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] text-sm font-semibold">
            Get started →
          </Link>
        </CardContent>
      </Card>
      
      <Card className="border-[hsl(var(--msneutral-medium))] hover:shadow-md transition duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Queries</h3>
            <Clock className="text-[hsl(var(--msblue-primary))] h-5 w-5" />
          </div>
          <p className="text-gray-600 text-sm mb-4">View your recent interactions with the assistant</p>
          <Link href="/recent" className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] text-sm font-semibold">
            View history →
          </Link>
        </CardContent>
      </Card>
      
      <Card className="border-[hsl(var(--msneutral-medium))] hover:shadow-md transition duration-150">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Current Context</h3>
            <Folder className="text-[hsl(var(--msblue-primary))] h-5 w-5" />
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {currentContext 
              ? currentContext.description || `${currentContext.name} documents` 
              : 'No context selected'}
          </p>
          {currentContext && (
            <a href="#" className="text-[hsl(var(--msblue-primary))] hover:text-[hsl(var(--msblue-secondary))] text-sm font-semibold">
              View details →
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;
