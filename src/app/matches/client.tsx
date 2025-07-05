

'use client';

import * as React from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { MoreHorizontal, Trash2, Edit, CalendarDays, SlidersHorizontal, List, LayoutGrid, ArrowUp, ArrowDown, PlusCircle, ChevronDown, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Match, Team, Competition, Field, MatchStatus } from "@/lib/data";
import { deleteMatchAction } from '@/lib/actions/matches';
import { MatchCard } from "./match-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditMatchDialog } from "./edit-match-dialog";
import { StrategicCalendarView, competitionTypeColors } from '../strategic-calendar/strategic-calendar-view';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlignLeft } from "lucide-react";

const MATCH_STATUSES: MatchStatus[] = ['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned'];

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

export default function MatchesClient({ matches, teams, fields, competitions, isAdmin }: { matches: Match[], teams: Team[], fields: Field[], competitions: Competition[], isAdmin: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [matchToDelete, setMatchToDelete] = React.useState<Match | null>(null);
  const [matchToEdit, setMatchToEdit] = React.useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [isClient, setIsClient] = React.useState(false);
  const [view, setView] = React.useState<'list' | 'card' | 'calendar'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 8;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string[]>(['completed']); // Default filter
  const [competitionFilter, setCompetitionFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);
  
  // State for calendar view
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = () => {
    if (!matchToDelete) return;
    startTransition(async () => {
      try {
        await deleteMatchAction(matchToDelete.matchId);
        toast({
          title: "Match Deleted",
          description: `The match between ${matchToDelete.teamAName} and ${matchToDelete.teamBName} has been deleted.`,
        });
        setIsDeleteDialogOpen(false);
        setMatchToDelete(null);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not delete match.",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setMatchToDelete(null);
      }
    });
  };
  
  const filteredMatches = React.useMemo(() => {
    return matches.filter(match => {
        const matchesSearch = `${match.teamAName} ${match.teamBName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(match.status);
        const matchesCompetition = competitionFilter.length === 0 || competitionFilter.includes(match.competitionId || "friendly");
        const matchesTeam = teamFilter.length === 0 || teamFilter.some(teamId => teamId === match.teamAId || teamId === match.teamBId);
        return matchesSearch && matchesStatus && matchesCompetition && matchesTeam;
    });
  }, [matches, searchQuery, statusFilter, competitionFilter, teamFilter]);
  
  const matchesOnSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredMatches.filter((match) => isSameDay(match.dateTime, selectedDate));
  }, [selectedDate, filteredMatches]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, competitionFilter, teamFilter, view]);


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

  const filtersApplied = searchQuery || statusFilter.length > 0 || competitionFilter.length > 0 || teamFilter.length > 0;
  
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setCompetitionFilter([]);
    setTeamFilter([]);
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Match Results</h1>
            <p className="text-muted-foreground">View all completed match results.</p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link href="/new-match">
                <PlusCircle className="mr-2" />
                Create New Match
              </Link>
            </Button>
          )}
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Results List</CardTitle>
                <CardDescription>A list of all matches in the system.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="sr-only">Filter Matches</span>
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
                      <div className="flex items-center justify-between">
                         <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filter Matches</h4>
                            <p className="text-sm text-muted-foreground">
                            Find matches by team, status, or competition.
                            </p>
                        </div>
                        {filtersApplied && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
                      </div>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="search-input">Team Name</Label>
                          <Input
                            id="search-input"
                            placeholder="Team name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="col-span-2 h-8"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Status</Label>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal capitalize"><span className="truncate">{statusFilter.length === 0 && "Select statuses..."}{statusFilter.length === 1 && statusFilter[0]}{statusFilter.length > 1 && `${statusFilter.length} statuses selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Status</DropdownMenuLabel><DropdownMenuSeparator />
                                    {MATCH_STATUSES.map(status => (<DropdownMenuCheckboxItem key={status} checked={statusFilter.includes(status)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...statusFilter, status] : statusFilter.filter(id => id !== status); setStatusFilter(newFilters); }} className="capitalize">{status}</DropdownMenuCheckboxItem>))}
                                    {statusFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setStatusFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Competition</Label>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{competitionFilter.length === 0 && "Select competitions..."}{competitionFilter.length === 1 && (competitions.find(c => c.competitionId === competitionFilter[0])?.name || "Friendly")}{competitionFilter.length > 1 && `${competitionFilter.length} comps selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Competition</DropdownMenuLabel><DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked={competitionFilter.includes("friendly")} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...competitionFilter, "friendly"] : competitionFilter.filter(id => id !== "friendly"); setCompetitionFilter(newFilters); }}>Friendly</DropdownMenuCheckboxItem><DropdownMenuSeparator />
                                    {competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilter.includes(comp.competitionId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...competitionFilter, comp.competitionId] : competitionFilter.filter(id => id !== comp.competitionId); setCompetitionFilter(newFilters); }}>{comp.name}</DropdownMenuCheckboxItem>))}
                                    {competitionFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setCompetitionFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Team</Label>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{teamFilter.length === 0 && "Select teams..."}{teamFilter.length === 1 && teams.find(t => t.teamId === teamFilter[0])?.name}{teamFilter.length > 1 && `${teamFilter.length} teams selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Team</DropdownMenuLabel><DropdownMenuSeparator />
                                    {teams.map(team => (<DropdownMenuCheckboxItem key={team.teamId} checked={teamFilter.includes(team.teamId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...teamFilter, team.teamId] : teamFilter.filter(id => id !== team.teamId); setTeamFilter(newFilters); }}>{team.name}</DropdownMenuCheckboxItem>))}
                                    {teamFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setTeamFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                 <TooltipProvider>
                    <div className="flex items-center rounded-md bg-muted p-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>List View</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-8 w-8"><LayoutGrid /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Card View</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('calendar')} className="h-8 w-8"><CalendarDays /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Calendar View</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'list' && (
                <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead>Match</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Competition</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Status</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                                        <Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName[0]}</AvatarFallback></Avatar>
                                        <span>{match.teamBName}</span>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>{isClient ? format(match.dateTime, "PPP p") : '\u00A0'}</TableCell>
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
                            {isAdmin && <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setMatchToEdit(match); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setMatchToDelete(match); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>}
                            </TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">{filtersApplied ? "No matches found matching your filters." : "No matches found. Get started by creating a new match."}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
            {view === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedMatches.length > 0 ? (
                        paginatedMatches.map(match => (
                            <MatchCard 
                                key={match.matchId} 
                                match={match} 
                                onEdit={() => { setMatchToEdit(match); setIsEditDialogOpen(true); }}
                                onDelete={() => { setMatchToDelete(match); setIsDeleteDialogOpen(true); }}
                                isAdmin={isAdmin}
                            />
                        ))
                    ) : (
                        <p className="col-span-full h-24 flex items-center justify-center text-muted-foreground">{filtersApplied ? "No matches found matching your filters." : "No matches found."}</p>
                    )}
                </div>
            )}
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
                    </div>
                </div>
            )}

            {view !== 'calendar' && totalPages > 1 && (
                <div className="flex items-center justify-center pt-8">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                    <span className="mx-4 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && matchToEdit && (
        <EditMatchDialog 
            match={matchToEdit} 
            teams={teams} 
            competitions={competitions} 
            fields={fields} 
            open={isEditDialogOpen} 
            onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setMatchToEdit(null); }}
        />
      )}

      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete this match and all of its associated data (lineups, officials, scorecards).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMatchToDelete(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Match"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
