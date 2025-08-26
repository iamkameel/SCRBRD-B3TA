
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Loader2, Search } from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { queryStatsAction } from '@/lib/actions/analysis';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

export function CommandSearch() {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [answer, setAnswer] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);
    
    const handleQueryChange = (search: string) => {
        setQuery(search);
        setAnswer(null); // Clear previous answer when query changes
    }
    
    const runQuery = React.useCallback(() => {
        if (!query) return;
        
        startTransition(async () => {
            try {
                const result = await queryStatsAction(query);
                setAnswer(result);
            } catch (error) {
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Could not perform search.",
                    variant: "destructive",
                });
            }
        });
    }, [query, toast]);

    return (
        <>
            <Button
                variant="outline"
                className="w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2" />
                <span className="hidden lg:inline-flex">Search anything...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput 
                    placeholder="Ask about league stats or a specific match..."
                    value={query}
                    onValueChange={handleQueryChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            runQuery();
                        }
                    }}
                />
                <CommandList>
                    {!isPending && !answer && <CommandEmpty>No results found.</CommandEmpty>}
                    {(isPending || answer) && (
                        <CommandGroup heading="AI Assistant">
                            <CommandItem onSelect={() => {}} className="aria-selected:bg-transparent">
                                {isPending ? (
                                    <div className="flex items-center gap-4 text-muted-foreground w-full">
                                        <Avatar>
                                            <AvatarFallback><Bot /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Finding an answer...</span>
                                        </div>
                                    </div>
                                ) : answer ? (
                                    <div className="flex items-start gap-4 w-full">
                                        <Avatar>
                                            <AvatarFallback><Bot /></AvatarFallback>
                                        </Avatar>
                                        <div className="pt-1">
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{answer}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </CommandItem>
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
