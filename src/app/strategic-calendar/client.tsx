
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ChevronDown, CalendarRange } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Match, Competition, Division } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


interface StrategicCalendarClientProps {
    matches: Match[];
    competitions: Competition[];
    divisions: Division[];
}

export default function StrategicCalendarClient({ matches, competitions, divisions }: StrategicCalendarClientProps) {
    const [competitionFilters, setCompetitionFilters] = React.useState<string[]>([]);
    const [divisionFilters, setDivisionFilters] = React.useState<string[]>([]);

    const filteredMatches = React.useMemo(() => {
        return matches.filter(match => {
            const competitionMatch = competitionFilters.length === 0 || 
                (match.competitionId && competitionFilters.includes(match.competitionId));
            const divisionMatch = divisionFilters.length === 0 || 
                (match.divisionId && divisionFilters.includes(match.divisionId));
            return competitionMatch && divisionMatch;
        });
    }, [matches, competitionFilters, divisionFilters]);

    const dayToMatchesMap = React.useMemo(() => {
        const map = new Map<string, Match[]>();
        filteredMatches.forEach(match => {
            const day = format(match.dateTime, 'yyyy-MM-dd');
            if (!map.has(day)) {
                map.set(day, []);
            }
            map.get(day)!.push(match);
        });
        return map;
    }, [filteredMatches]);

    function Day({ date, ...props }: { date: Date } & React.ComponentProps<'div'>) {
        const dayKey = format(date, 'yyyy-MM-dd');
        const matchesForDay = dayToMatchesMap.get(dayKey) || [];

        const dayContent = (
             <div className="relative w-full h-full flex items-center justify-center">
                {format(date, 'd')}
                {matchesForDay.length > 0 && (
                     <div className="absolute bottom-1 flex items-center gap-0.5">
                        {Array.from({ length: Math.min(matchesForDay.length, 3) }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                    </div>
                )}
            </div>
        );

        if (matchesForDay.length === 0) {
            return <div {...props}>{dayContent}</div>;
        }
    
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div {...props} className={cn(props.className, 'cursor-pointer')}>
                        {dayContent}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Matches on {format(date, 'PPP')}</h4>
                        <Separator />
                        <ScrollArea className="h-48">
                            <ul className="space-y-2 py-2">
                                {matchesForDay.map(match => (
                                    <li key={match.matchId}>
                                        <Link href={`/matches/${match.matchId}`} className="block p-2 rounded-md hover:bg-muted">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Avatar className="h-4 w-4"><AvatarImage src={match.teamALogoUrl} /></Avatar>
                                                <span className="font-semibold">{match.teamAName}</span>
                                                <span>vs</span>
                                                <Avatar className="h-4 w-4"><AvatarImage src={match.teamBLogoUrl} /></Avatar>
                                                <span className="font-semibold">{match.teamBName}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{match.competitionName}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
    
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategic Calendar</h1>
                <p className="text-muted-foreground">A high-level overview of all fixtures. Use the filters to narrow your view.</p>
            </header>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between font-normal min-w-[200px]"><span className="truncate">{competitionFilters.length === 0 ? "Filter by Competition..." : `${competitionFilters.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50 ml-2" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56"><DropdownMenuLabel>Competitions</DropdownMenuLabel><DropdownMenuSeparator />
                                {competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilters.includes(comp.competitionId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => setCompetitionFilters(prev => checked ? [...prev, comp.competitionId] : prev.filter(id => id !== comp.competitionId))}>{comp.name}</DropdownMenuCheckboxItem>))}
                                {competitionFilters.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setCompetitionFilters([])} className="justify-center text-sm">Clear</DropdownMenuItem></>)}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between font-normal min-w-[200px]"><span className="truncate">{divisionFilters.length === 0 ? "Filter by Division..." : `${divisionFilters.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50 ml-2" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56"><DropdownMenuLabel>Divisions</DropdownMenuLabel><DropdownMenuSeparator />
                                {divisions.map(div => (<DropdownMenuCheckboxItem key={div.divisionId} checked={divisionFilters.includes(div.divisionId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => setDivisionFilters(prev => checked ? [...prev, div.divisionId] : prev.filter(id => id !== div.divisionId))}>{div.name}</DropdownMenuCheckboxItem>))}
                                {divisionFilters.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setDivisionFilters([])} className="justify-center text-sm">Clear</DropdownMenuItem></>)}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        numberOfMonths={3}
                        className="p-0"
                        components={{ Day }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
