

'use client';

import * as React from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { MoreHorizontal, Trash2, Edit, CalendarDays, SlidersHorizontal, List, LayoutGrid, ArrowUp, ArrowDown, PlusCircle, ChevronDown, Trophy, AlignLeft, Search, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import type { Match, Team, Competition, Field, MatchStatus, Person } from "@/lib/data";
import { deleteMatchAction, assignOfficialToMatchAction } from '@/lib/actions/matches';
import { MatchCard } from "./match-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditMatchDialog } from "./edit-match-dialog";
import { StrategicCalendarView, competitionTypeColors } from '../strategic-calendar/strategic-calendar-view';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.literal('Scorer'),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

function AssignScorerDialog({ match, scorers, open, onOpenChange }: { match: Match; scorers: Person[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { role: "Scorer" },
  });

  function onSubmit(data: AssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignOfficialToMatchAction(match.matchId, data);
        toast({
          title: "Scorer Assigned",
          description: `A scorer has been assigned to the match.`,
        });
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not assign scorer.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Scorer to Match</DialogTitle>
          <CardDescription>Select a person with the Scorer role.</CardDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a scorer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {scorers.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Assigning..." : "Assign to Match"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
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

export default function MatchesClient({ matches, teams, fields, competitions, isAdmin, scorers, canAssignScorer }: { matches: Match[], teams: Team[], fields: Field[], competitions: Competition[], isAdmin: boolean, scorers: Person[], canAssignScorer: boolean }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [matchToDelete, setMatchToDelete] = React.useState<Match | null>(null);
  const [matchToEdit, setMatchToEdit] = React.useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAssignScorerDialogOpen, setIsAssignScorerDialogOpen] = React.useState(false);
  const [matchToAssignScorer, setMatchToAssignScorer] = React.useState<Match | null>(null);

  const [isClient, setIsClient] = React.useState(false);
  const [view, setView] = React.useState<'list' | 'card' | 'calendar'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 8;

  const [searchQuery, setSearchQuery] = React.useState("");
  
  const statusParam = searchParams.get('status');
  const [statusTab, setStatusTab] = React.useState<MatchStatus | 'all' | 'other'>(statusParam as MatchStatus || 'scheduled');
  
  const [competitionFilter, setCompetitionFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    setStatusTab(statusParam as MatchStatus || 'scheduled');
  }, [statusParam]);
  
  const handleTabChange = (value: string) => {
    const newStatus = value as any;
    setStatusTab(newStatus);
    const params = new URLSearchParams(searchParams);
    if (newStatus === 'scheduled') {
        params.delete('status');
    } else {
        params.set('status', newStatus);
    }
    router.replace(`/matches?${params.toString()}`);
  };

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

  const availableTeamsForFilter = React.useMemo(() => {
    if (competitionFilter.length === 0) {
        return teams;
    }

    const teamIdSet = new Set<string>();

    competitionFilter.forEach(compId => {
        if (compId === 'friendly') {
            matches.forEach(match => {
                if (!match.competitionId) { // This is a friendly
                    teamIdSet.add(match.teamAId);
                    if (match.teamBId) teamIdSet.add(match.teamBId);
                }
            });
        } else {
            const competition = competitions.find(c => c.competitionId === compId);
            competition?.teamIds?.forEach(id => teamIdSet.add(id));
        }
    });

    return teams.filter(team => teamIdSet.has(team.teamId));
  }, [competitionFilter, competitions, teams, matches]);

  React.useEffect(() => {
    if (teamFilter.length > 0) {
        const availableIds = new Set(availableTeamsForFilter.map(t => t.teamId));
        const newTeamFilterState = teamFilter.filter(id => availableIds.has(id));
        
        if (newTeamFilterState.length !== teamFilter.length) {
            setTeamFilter(newTeamFilterState);
        }
    }
  }, [availableTeamsForFilter, teamFilter]);
  
  const filteredMatches = React.useMemo(() => {
    return matches.filter(match => {
        let matchesStatus: boolean;
        if (statusTab === 'all') {
            matchesStatus = true;
        } else if (statusTab === 'other') {
            matchesStatus = ['postponed', 'cancelled', 'abandoned'].includes(match.status);
        } else {
            matchesStatus = match.status === statusTab;
        }
        
        const matchesSearch = `${match.teamAName} ${match.teamBName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCompetition = competitionFilter.length === 0 || competitionFilter.includes(match.competitionId || "friendly");
        const matchesTeam = teamFilter.length === 0 || teamFilter.some(teamId => teamId === match.teamAId || teamId === match.teamBId);
        return matchesStatus && matchesSearch && matchesCompetition && matchesTeam;
    });
  }, [matches, searchQuery, statusTab, competitionFilter, teamFilter]);
  
  const matchesOnSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredMatches.filter((match) => isSameDay(match.dateTime, selectedDate));
  }, [selectedDate, filteredMatches]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusTab, competitionFilter, teamFilter, view]);


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

  const filtersApplied = searchQuery || competitionFilter.length > 0 || teamFilter.length > 0;
  
  const clearFilters = () => {
    setSearchQuery("");
    setCompetitionFilter([]);
    setTeamFilter([]);
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Matches</h1>
            <p className="text-muted-foreground">View all upcoming, live, and completed matches.</p>
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

        <Tabs defaultValue={statusTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Match List</CardTitle>
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
                            Find matches by team or competition.
                            </p>
                        </div>
                        {filtersApplied && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
                      </div>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="search-input">Search by Name</Label>
                          <Input
                            id="search-input"
                            placeholder="Team name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="col-span-2 h-8"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Filter by Competition</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{competitionFilter.length === 0 && "Select competitions..."}{competitionFilter.length === 1 && (competitions.find(c => c.competitionId === competitionFilter[0])?.name || "Friendly")}{competitionFilter.length > 1 && `${competitionFilter.length} comps selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Competition</DropdownMenuLabel><DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked={competitionFilter.includes("friendly")} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...competitionFilter, "friendly"] : competitionFilter.filter(id => id !== "friendly"); setCompetitionFilter(newFilters); }}>Friendly</DropdownMenuCheckboxItem><DropdownMenuSeparator />
                                    {competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilter.includes(comp.competitionId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...competitionFilter, comp.competitionId] : competitionFilter.filter(id => id !== comp.competitionId); setCompetitionFilter(newFilters); }}>{comp.name}</DropdownMenuCheckboxItem>))}
                                    {competitionFilter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setCompetitionFilter([])} className="justify-center text-sm">Clear filter</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Filter by Team(s)</Label>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{teamFilter.length === 0 && "Select teams..."}{teamFilter.length === 1 && teams.find(t => t.teamId === teamFilter[0])?.name}{teamFilter.length > 1 && `${teamFilter.length} teams selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56"><DropdownMenuLabel>Filter by Team</DropdownMenuLabel><DropdownMenuSeparator />
                                    {availableTeamsForFilter.map(team => (<DropdownMenuCheckboxItem key={team.teamId} checked={teamFilter.includes(team.teamId)} onSelect={(e) => e.preventDefault()} onCheckedChange={checked => { const newFilters = checked ? [...teamFilter, team.teamId] : teamFilter.filter(id => id !== team.teamId); setTeamFilter(newFilters); }}>{team.name}</DropdownMenuCheckboxItem>))}
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
                            <TooltipTrigger asChild><Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List /></Button></TooltipTrigger>
                            <TooltipContent><p>List View</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild><Button variant={view === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('card')} className="h-8 w-8"><LayoutGrid /></Button></TooltipTrigger>
                            <TooltipContent><p>Card View</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild><Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('calendar')} className="h-8 w-8"><CalendarDays /></Button></TooltipTrigger>
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
                                        <Avatar className="h-6 w-6"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName?.[0]}</AvatarFallback></Avatar>
                                        <span>{match.teamBName}</span>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>{isClient ? format(match.dateTime, "PPP p") : '\u00A0'}</TableCell>
                            <TableCell>
                                {match.competitionId ? (
                                    <Link href={`/competitions/${match.competitionId}`} className="hover:underline">
                                        {match.competitionName || 'Competition'}
                                    </Link>
                                ) : (
                                    'Friendly'
                                )}
                            </TableCell>
                            <TableCell>
                                <Link href={`/fields/${match.fieldId}`} className="hover:underline">
                                    {match.fieldName}
                                </Link>
                            </TableCell>
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
                                    {canAssignScorer && (
                                        <DropdownMenuItem onSelect={() => { setMatchToAssignScorer(match); setIsAssignScorerDialogOpen(true); }}>
                                            <User className="mr-2 h-4 w-4" /> Assign Scorer
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onSelect={() => { setMatchToEdit(match); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setMatchToDelete(match); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>}
                            </TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">{filtersApplied ? "No matches found matching your filters." : "No matches found."}</TableCell></TableRow>
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
                                onAssignScorer={() => { setMatchToAssignScorer(match); setIsAssignScorerDialogOpen(true); }}
                                canManage={isAdmin}
                                canAssignScorer={canAssignScorer}
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
          <CardFooter className="border-t pt-4 mt-4">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="font-semibold">Legend:</span>
                {Object.entries(competitionTypeColors).map(([type, colorClass]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className={cn("w-2.5 h-2.5 rounded-full", colorClass || 'bg-gray-400')}></div>
                        <span className="capitalize">{type}</span>
                    </div>
                ))}
            </div>
          </CardFooter>
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

      {canAssignScorer && matchToAssignScorer && (
        <AssignScorerDialog
            match={matchToAssignScorer}
            scorers={scorers}
            open={isAssignScorerDialogOpen}
            onOpenChange={(open) => { setIsAssignScorerDialogOpen(open); if (!open) setMatchToAssignScorer(null); }}
        />
      )}

      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this match and all of its associated data (lineups, officials, scorecards).</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMatchToDelete(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Match"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
