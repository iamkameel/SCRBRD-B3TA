
'use client';

import * as React from 'react';
import { format, isSameDay, startOfWeek, endOfWeek, endOfMonth, addMonths } from 'date-fns';
import Link from 'next/link';
import { ChevronDown, Calendar as CalendarIcon, List, Trophy, MapPin, AlignLeft } from 'lucide-react';

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
        <div className={cn("w-1 h-8 rounded-full", competitionTypeColors[match.competitionType || 'Friendlies'] || 'bg-gray-400')}></div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Avatar className="h-4 w-4"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName?.[0]}</AvatarFallback></Avatar>
            <span className="font-semibold">{match.teamAName}</span>
            <span className="text-muted-foreground">vs</span>
            <Avatar className="h-4 w-4"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
            <span className="font-semibold">{match.teamBName}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
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
    
    const competitionsWithFixtures = competitions.filter(c => filteredMatches.some(m => m.competitionId === c.competitionId));

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
                <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">Filter by Competition...<ChevronDown className="ml-2 h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Competitions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             {competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilters.includes(comp.competitionId)} onCheckedChange={checked => setCompetitionFilters(prev => checked ? [...prev, comp.competitionId] : prev.filter(id => id !== comp.competitionId))}>{comp.name}</DropdownMenuCheckboxItem>))}
                            {competitionFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setCompetitionFilters([])}>Clear</DropdownMenuItem></>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">Filter by Division...<ChevronDown className="ml-2 h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuLabel>Divisions</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             {divisions.map(div => (<DropdownMenuCheckboxItem key={div.divisionId} checked={divisionFilters.includes(div.divisionId)} onCheckedChange={checked => setDivisionFilters(prev => checked ? [...prev, div.divisionId] : prev.filter(id => id !== div.divisionId))}>{div.name}</DropdownMenuCheckboxItem>))}
                             {divisionFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDivisionFilters([])}>Clear</DropdownMenuItem></>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">Filter by Venue...<ChevronDown className="ml-2 h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Venues</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             {fields.map(field => (<DropdownMenuCheckboxItem key={field.fieldId} checked={venueFilters.includes(field.fieldId)} onCheckedChange={checked => setVenueFilters(prev => checked ? [...prev, field.fieldId] : prev.filter(id => id !== field.fieldId))}>{field.name}</DropdownMenuCheckboxItem>))}
                             {venueFilters.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setVenueFilters([])}>Clear</DropdownMenuItem></>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center rounded-md bg-muted p-1">
                    <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('calendar')} className="gap-1"><CalendarIcon className="h-4 w-4" /> Calendar</Button>
                    <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-1"><List className="h-4 w-4" /> List</Button>
                    <Button variant={view === 'agenda' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('agenda')} className="gap-1"><AlignLeft className="h-4 w-4" /> Agenda</Button>
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
                                    <ScrollArea className="h-64 pr-3">
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
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Button onClick={() => setAgendaPeriod('week')} variant={agendaPeriod === 'week' ? 'secondary' : 'outline'}>This Week</Button>
                        <Button onClick={() => setAgendaPeriod('month')} variant={agendaPeriod === 'month' ? 'secondary' : 'outline'}>This Month</Button>
                        <Button onClick={() => setAgendaPeriod('quarter')} variant={agendaPeriod === 'quarter' ? 'secondary' : 'outline'}>Next 3 Months</Button>
                    </div>
                    <AgendaView matches={agendaMatches} />
                </div>
             )}

        </div>
    )
}

    