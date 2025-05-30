import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Context } from '@shared/schema';
import { Input } from '@/components/ui/input';

interface ContextSelectorProps {
  contextList: Context[];
  selectedContext: Context | null;
  onContextChange: (context: Context) => void;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  contextList,
  selectedContext,
  onContextChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredContexts = contextList.filter(context => 
    context.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (context.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center justify-between bg-white border border-[hsl(var(--msneutral-medium))] rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--msblue-primary))]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedContext ? selectedContext.name : 'Select Context'}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute mt-1 w-64 bg-white border border-[hsl(var(--msneutral-medium))] rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="flex items-center border border-[hsl(var(--msneutral-medium))] rounded px-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search contexts..."
                className="w-full border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredContexts.length > 0 ? (
              filteredContexts.map((context) => (
                <li 
                  key={context.id}
                  className="px-4 py-2 hover:bg-[hsl(var(--msneutral-light))] cursor-pointer"
                  onClick={() => {
                    onContextChange(context);
                    setIsOpen(false);
                  }}
                >
                  {context.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 italic">No contexts found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContextSelector;
