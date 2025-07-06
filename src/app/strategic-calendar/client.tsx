

'use client';

import * as React from 'react';
import { format, isSameDay, startOfWeek, endOfWeek, endOfMonth, addMonths } from 'date-fns';
import Link from 'next/link';
import { ChevronDown, Calendar as CalendarIcon, List, Trophy, MapPin, AlignLeft, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Match, Competition, Division, Field } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { StrategicCalendarView, competitionTypeColors } from './strategic-calendar-view';
import { AgendaView } from './agenda-view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StrategicCalendarClientProps {
    matches: Match[];
    competitions: Competition[];
    divisions: Division[];
    fields: Field[];
}

function MatchListItem({ match }: { match: Match }) {
  return (
    <Link href={`/matches/${match.matchId}`} className="block p-2 -mx-2 rounded-md hover:bg-muted">
      <div className="flex items-center gap-3">
        <div className={cn("w-1 self-stretch rounded-full", competitionTypeColors[match.competitionType || 'Friendlies'] || 'bg-gray-400')} />
        <div className="flex-1">
            <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-5 w-5"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName?.[0]}</AvatarFallback></Avatar>
                    <span className="font-semibold truncate">{match.teamAName}</span>
                </div>
                <span className="text-xs text-muted-foreground">vs</span>
                <div className="flex items-center gap-2 truncate justify-end">
                    <span className="font-semibold truncate text-right">{match.teamBName}</span>
                    <Avatar className="h-5 w-5"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                </div>
            </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {format(match.dateTime, 'p')} @ {match.fieldName}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function StrategicCalendarClient({ matches, competitions, divisions, fields }: StrategicCalendarClientProps) {
    const [view, setView] = React.useState<'calendar' | 'list' | 'agenda'>('calendar');
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());
    
    const [competitionFilters, setCompetitionFilters] = React.useState<string[]>([]);
    const [divisionFilters, setDivisionFilters] = React.useState<string[]>([]);
    const [venueFilters, setVenueFilters] = React.useState<string[]>([]);
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
    const [agendaPeriod, setAgendaPeriod] = React.useState<'week' | 'month' | 'quarter'>('month');
    
    const filtersApplied = competitionFilters.length > 0 || divisionFilters.length > 0 || venueFilters.length > 0;

    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredMatches = React.useMemo(() => {
        return matches
            .filter(match => {
                const compMatch = competitionFilters.length === 0 || competitionFilters.includes(match.competitionId || 'friendly');
                const divMatch = divisionFilters.length === 0 || divisionFilters.includes(match.divisionId || '');
                const venueMatch = venueFilters.length === 0 || venueFilters.includes(match.fieldId);
                return compMatch && divMatch && venueMatch;
            })
            .sort((a, b) => {
                const dateA = a.dateTime.getTime();
                const dateB = b.dateTime.getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
    }, [matches, competitionFilters, divisionFilters, venueFilters, sortOrder]);
    
    const paginatedMatches = filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [competitionFilters, divisionFilters, venueFilters, sortOrder, view]);

    const matchesOnSelectedDate = React.useMemo(() => {
        if (!selectedDate) return [];
        return filteredMatches.filter(match => isSameDay(match.dateTime, selectedDate));
    }, [selectedDate, filteredMatches]);

     const agendaMatches = React.useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        let end;

        switch (agendaPeriod) {
            case 'week':
                end = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                end = endOfMonth(now);
                break;
            case 'quarter':
                end = addMonths(now, 3);
                break;
        }

        return filteredMatches.filter(match => match.dateTime >= start && match.dateTime <= end);
    }, [filteredMatches, agendaPeriod]);

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategic Calendar</h1>
                <p className="text-muted-foreground">A high-level overview of all fixtures. Use the filters to narrow your view.</p>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                             <Button variant="outline" size="icon" className="relative">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="sr-only">Filter Fixtures</span>
                                {filtersApplied && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2"><h4 className="font-medium leading-none">Filter Calendar</h4><p className="text-sm text-muted-foreground">Select one or more filters to apply.</p></div>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-3 items-center gap-4"><Label>Competition</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{competitionFilters.length === 0 ? "Select..." : `${competitionFilters.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent><DropdownMenuLabel>Competitions</DropdownMenuLabel><DropdownMenuSeparator />{competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilters.includes(comp.competitionId)} onCheckedChange={checked => setCompetitionFilters(prev => checked ? [...prev, comp.competitionId] : prev.filter(id => id !== comp.competitionId))}>{comp.name}</DropdownMenuCheckboxItem>))}{competitionFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setCompetitionFilters([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label>Division</Label>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{divisionFilters.length === 0 ? "Select..." : `${divisionFilters.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent><DropdownMenuLabel>Divisions</DropdownMenuLabel><DropdownMenuSeparator />{divisions.map(div => (<DropdownMenuCheckboxItem key={div.divisionId} checked={divisionFilters.includes(div.divisionId)} onCheckedChange={checked => setDivisionFilters(prev => checked ? [...prev, div.divisionId] : prev.filter(id => id !== div.divisionId))}>{div.name}</DropdownMenuCheckboxItem>))}{divisionFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDivisionFilters([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4"><Label>Venue</Label>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{venueFilters.length === 0 ? "Select..." : `${venueFilters.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent><DropdownMenuLabel>Venues</DropdownMenuLabel><DropdownMenuSeparator />{fields.map(field => (<DropdownMenuCheckboxItem key={field.fieldId} checked={venueFilters.includes(field.fieldId)} onCheckedChange={checked => setVenueFilters(prev => checked ? [...prev, field.fieldId] : prev.filter(id => id !== field.fieldId))}>{field.name}</DropdownMenuCheckboxItem>))}{venueFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setVenueFilters([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {view === 'agenda' && (
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setAgendaPeriod('week')} variant={agendaPeriod === 'week' ? 'secondary' : 'outline'} size="sm">Week</Button>
                            <Button onClick={() => setAgendaPeriod('month')} variant={agendaPeriod === 'month' ? 'secondary' : 'outline'} size="sm">Month</Button>
                            <Button onClick={() => setAgendaPeriod('quarter')} variant={agendaPeriod === 'quarter' ? 'secondary' : 'outline'} size="sm">Quarter</Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center rounded-md bg-muted p-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('calendar')} className="h-8 w-8"><CalendarIcon /></Button></TooltipTrigger>
                            <TooltipContent><p>Calendar View</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List /></Button></TooltipTrigger>
                            <TooltipContent><p>List View</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant={view === 'agenda' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('agenda')} className="h-8 w-8"><AlignLeft /></Button></TooltipTrigger>
                            <TooltipContent><p>Agenda View</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {view === 'calendar' && (
                 <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <StrategicCalendarView 
                            matches={filteredMatches} 
                            selectedDate={selectedDate} 
                            onDateSelect={setSelectedDate} 
                            displayMonth={displayMonth}
                            onMonthChange={setDisplayMonth}
                        />
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Match Details</CardTitle>
                                    {selectedDate && <Button variant="link" size="sm" onClick={() => setSelectedDate(undefined)}>Clear selection</Button>}
                                </div>
                                <CardDescription>{selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}</CardDescription>
                            </CardHeader>
                            <CardContent className="min-h-[200px]">
                                {selectedDate && matchesOnSelectedDate.length > 0 ? (
                                    <ScrollArea className="h-96 pr-3">
                                        <div className="space-y-4">
                                            {matchesOnSelectedDate.map(match => <MatchListItem key={match.matchId} match={match} />)}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                        <p>{selectedDate ? 'No fixtures on this date.' : 'Click on a date to view fixtures.'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Competition Legend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(competitionTypeColors).map(([type, colorClass]) => (
                                    <div key={type} className="flex items-center gap-2 text-sm">
                                        <div className={cn("w-3 h-3 rounded-full", colorClass || 'bg-gray-400')}></div>
                                        <span className="text-muted-foreground capitalize">{type}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {view === 'agenda' && (
                <AgendaView matches={agendaMatches} />
            )}
            {view === 'list' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Match List</CardTitle>
                        <CardDescription>All fixtures matching your current filters, sorted chronologically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Match</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Competition</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedMatches.length > 0 ? (
                                paginatedMatches.map((match) => (
                                    <TableRow key={match.matchId}>
                                    <TableCell className="font-medium">
                                        <Link href={`/matches/${match.matchId}`} className="hover:underline flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
                                                <span>{match.teamAName}</span>
                                            </div>
                                            <span className="text-muted-foreground text-xs">vs</span>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                                                <span>{match.teamBName}</span>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                                    <TableCell>{match.competitionName || 'Friendly'}</TableCell>
                                    <TableCell>{match.fieldName}</TableCell>
                                    <TableCell>
                                    <Badge
                                        variant={
                                        match.status === 'completed' ? 'secondary' :
                                        match.status === 'live' ? 'destructive' :
                                        ['postponed', 'cancelled', 'abandoned'].includes(match.status) ? 'outline' :
                                        'default'
                                        }
                                        className="capitalize"
                                    >
                                        {match.status}
                                    </Badge>
                                    </TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No matches found matching your filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                         {totalPages > 1 && (
                            <div className="flex items-center justify-center pt-8">
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                                <span className="mx-4 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
