'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Loader2, Users, FileText } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { queues: [], tokens: [] };
      const res = await api.get(`/search?q=${debouncedQuery}`);
      return res.data.data;
    },
    enabled: debouncedQuery.length > 0
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-white transition-colors w-64 shadow-sm"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search QueueOS...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search queues or tokens..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : (
              "No results found."
            )}
          </CommandEmpty>
          
          {data?.queues?.length > 0 && (
            <CommandGroup heading="Queues">
              {data.queues.map((queue: { id: string; name: string }) => (
                <CommandItem
                  key={queue.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/dashboard/queues/${queue.id}`);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>{queue.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data?.tokens?.length > 0 && (
            <CommandGroup heading="Tokens">
              {data.tokens.map((token: { id: string; personName: string; tokenNumber: string; queue: { id: string; name: string } }) => (
                <CommandItem
                  key={token.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/dashboard/queues/${token.queue.id}`);
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>{token.tokenNumber}</span>
                    <span className="text-zinc-500">- {token.personName}</span>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {token.queue.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
