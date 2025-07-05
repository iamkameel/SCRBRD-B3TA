
'use client';

import * as React from 'react';
import { format, isSameDay } from 'date-fns';
import Link from 'next/link';
import { ChevronDown, Calendar as CalendarIcon, List, Trophy, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import type { Match, Competition, Division, Field } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface StrategicCalendarClientProps {
    matches: Match[];
    competitions: Competition[];
    divisions: Division[];
    fields: Field[];
}

const competitionTypeColors: { [key: string]: string } = {
    'Cup': 'bg-green-500',
    'League': 'bg-blue-500',
    'Tournament': 'bg-purple-500',
    'Friendlies': 'bg-red-500',
    'Festival': 'bg-orange-500',
};

const competitionTypeMap: { [key: string]: string } = {
    'Cup': 'Coastal Cup',
    'League': 'Regional League',
    'Tournament': 'Inter-School Championship',
    'Friendlies': 'Friendly Matches',
};

function MatchListItem({ match }: { match: Match }) {
  return (
    <Link href={`/matches/${match.matchId}`} className="block p-2 -mx-2 rounded-md hover:bg-muted">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 shrink-0">
          <Avatar className="h-5 w-5"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName?.[0]}</AvatarFallback></Avatar>
          <span className="font-semibold text-xs">{match.teamAName}</span>
        </div>
        <span className="text-xs text-muted-foreground">vs</span>
        <div className="flex items-center gap-1 shrink-0">
          <Avatar className="h-5 w-5"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
          <span className="font-semibold text-xs">{match.teamBName}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1 pl-1">
        {format(match.dateTime, 'p')} @ {match.fieldName}
      </p>
    </Link>
  );
}

export default function StrategicCalendarClient({ matches, competitions, divisions, fields }: StrategicCalendarClientProps) {
    const [view, setView] = React.useState<'calendar' | 'list' | 'agenda'>('list');
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
    
    const [competitionFilters, setCompetitionFilters] = React.useState<string[]>([]);
    const [divisionFilters, setDivisionFilters] = React.useState<string[]>([]);
    const [venueFilters, setVenueFilters] = React.useState<string[]>([]);
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

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

    const matchDays = React.useMemo(() => {
        return filteredMatches.map(m => m.dateTime);
    }, [filteredMatches]);
    
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategic Calendar</h1>
                <p className="text-muted-foreground">A high-level overview of all fixtures. Use the filters to narrow your view.</p>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    <Button variant={'ghost'} size="sm" className="gap-1 cursor-not-allowed" disabled>Agenda</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>All Fixtures</CardTitle>
                                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4"/> {filteredMatches.length} fixtures</span>
                                    <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4"/> {competitionsWithFixtures.length} competitions</span>
                                </div>
                            </div>
                            {view === 'list' && (
                                <div className="w-48">
                                    <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asc">Sort by Date (Earliest First)</SelectItem>
                                            <SelectItem value="desc">Sort by Date (Latest First)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {view === 'calendar' && (
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    modifiers={{ hasMatch: matchDays }}
                                    modifiersClassNames={{ hasMatch: 'bg-primary/20 rounded-md text-primary-foreground' }}
                                    className="w-full flex justify-center"
                                />
                            )}
                            {view === 'list' && (
                                <div className="space-y-4">
                                {filteredMatches.length > 0 ? filteredMatches.map(match => <MatchListItem key={match.matchId} match={match} />) : <p className="text-center text-muted-foreground py-10">No fixtures match your filters.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-4 space-y-8">
                     <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Match Details</CardTitle>
                                {selectedDate && <Button variant="link" size="sm" onClick={() => setSelectedDate(undefined)}>Select a date</Button>}
                            </div>
                            <CardDescription>{selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-[200px]">
                            {selectedDate && matchesOnSelectedDate.length > 0 ? (
                                <ScrollArea className="h-64">
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
                            {Object.entries(competitionTypeMap).map(([type, name]) => (
                                <div key={type} className="flex items-center gap-2 text-sm">
                                    <div className={cn("w-3 h-3 rounded-full", competitionTypeColors[type] || 'bg-gray-400')}></div>
                                    <span>{name}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
