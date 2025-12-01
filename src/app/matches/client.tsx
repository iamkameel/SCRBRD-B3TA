

'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PlusCircle, MoreHorizontal, Edit, Trash2, User, Link as LinkIcon, Calendar, Clock, Trophy, MapPin, SlidersHorizontal, List, LayoutGrid, ArrowDown, ArrowUp, ChevronDown } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Match, Team, Competition, Field, Person, MatchStatus, Season, Division } from "@/lib/data";
import { deleteMatchAction, assignOfficialToMatchAction } from '@/lib/actions/matches';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EditMatchDialog } from "./edit-match-dialog";
import { MatchCard } from './match-card';
import { MatchCalendar } from './match-calendar';
import NewMatchClient from "../new-match/client";

const officialAssignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type OfficialAssignmentFormValues = z.infer<typeof officialAssignmentSchema>;
const OFFICIAL_ROLES = ["Umpire", "Scorer"];

function AssignOfficialDialog({ match, people, open, onOpenChange }: { match: Match, people: Person[], open: boolean, onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<OfficialAssignmentFormValues>({
    resolver: zodResolver(officialAssignmentSchema),
    defaultValues: { role: "Umpire" },
  });
  
  React.useEffect(() => {
    if (open) {
      form.reset({ role: "Umpire", personId: undefined });
    }
  }, [open, form]);

  function onSubmit(data: OfficialAssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignOfficialToMatchAction(match.matchId, data);
        toast({
          title: "Official Assigned",
          description: `The person has been assigned to the match.`,
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not assign official.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Official to Match</DialogTitle>
          <DialogDescription>Select a person and their role for this match.</DialogDescription>
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
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {people.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="Umpire" disabled={isPending}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {OFFICIAL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
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

export default function MatchesClient({ matches, teams, fields, competitions, seasons, divisions, isAdmin, scorers, canAssignScorer }: { matches: Match[], teams: Team[], fields: Field[], competitions: Competition[], seasons: Season[], divisions: Division[], isAdmin: boolean, scorers: Person[], canAssignScorer: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [matchToAssignScorer, setMatchToAssignScorer] = React.useState<Match | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignScorerDialogOpen, setIsAssignScorerDialogOpen] = React.useState(false);

  // View, Pagination, Filtering, and Sorting state
  const [view, setView] = React.useState<'list' | 'card' | 'calendar'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = view === 'list' ? 10 : 9;
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [competitionFilter, setCompetitionFilter] = React.useState<string[]>([]);
  const [venueFilter, setVenueFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<MatchStatus[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: 'dateTime' | 'teamAName'; direction: 'ascending' | 'descending' }>({ key: 'dateTime', direction: 'ascending' });

  const handleDelete = () => {
    if (!selectedMatch) return;
    startTransition(async () => {
      try {
        await deleteMatchAction(selectedMatch.matchId);
        toast({ title: "Match Deleted", description: "The match has been successfully deleted." });
        setIsDeleteDialogOpen(false);
        setSelectedMatch(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete match.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedMatch(null);
      }
    });
  };

  const filteredMatches = React.useMemo(() => {
    return matches.filter(match => {
        const lowercasedQuery = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === '' || 
            match.teamAName.toLowerCase().includes(lowercasedQuery) || 
            match.teamBName.toLowerCase().includes(lowercasedQuery) ||
            match.competitionName?.toLowerCase().includes(lowercasedQuery);
            
        const matchesCompetition = competitionFilter.length === 0 || competitionFilter.includes(match.competitionId || 'friendly');
        const matchesVenue = venueFilter.length === 0 || venueFilter.includes(match.fieldId);
        const matchesTeam = teamFilter.length === 0 || teamFilter.includes(match.teamAId) || teamFilter.includes(match.teamBId);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(match.status);

        return matchesSearch && matchesCompetition && matchesVenue && matchesTeam && matchesStatus;
    });
  }, [matches, searchQuery, competitionFilter, venueFilter, teamFilter, statusFilter]);

  const sortedMatches = React.useMemo(() => {
    let sortableItems = [...filteredMatches];
    sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });
    return sortableItems;
  }, [filteredMatches, sortConfig]);

  const filtersApplied = searchQuery || competitionFilter.length > 0 || venueFilter.length > 0 || teamFilter.length > 0 || statusFilter.length > 0;
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, competitionFilter, venueFilter, teamFilter, statusFilter, view, sortConfig]);

  const paginatedMatches = sortedMatches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedMatches.length / ITEMS_PER_PAGE);

  const requestSort = (key: 'dateTime' | 'teamAName') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (column: 'dateTime' | 'teamAName') => {
    if (sortConfig.key !== column) return null;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-4 w-4" />
    return <ArrowDown className="ml-2 h-4 w-4" />
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Matches</h1><p className="text-muted-foreground">Manage your match fixtures and results.</p></div>
          <NewMatchClient teams={teams} competitions={competitions} fields={fields} seasons={seasons} divisions={divisions} isAdmin={isAdmin}/>
        </header>

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
                            <div className="space-y-2"><h4 className="font-medium leading-none">Filter Matches</h4><p className="text-sm text-muted-foreground">Find matches by team, venue, or status.</p></div>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="search-input">Search</Label><Input id="search-input" placeholder="Team name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="col-span-2 h-8"/></div>
                                <div className="grid grid-cols-3 items-center gap-4"><Label>Team</Label>
                                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{teamFilter.length === 0 ? "Select teams..." : `${teamFilter.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent><DropdownMenuLabel>Teams</DropdownMenuLabel><DropdownMenuSeparator />{teams.map(team => (<DropdownMenuCheckboxItem key={team.teamId} checked={teamFilter.includes(team.teamId)} onCheckedChange={checked => setTeamFilter(prev => checked ? [...prev, team.teamId] : prev.filter(id => id !== team.teamId))}>{team.name}</DropdownMenuCheckboxItem>))}{teamFilter.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setTeamFilter([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
                                </div>
                                 <div className="grid grid-cols-3 items-center gap-4"><Label>Venue</Label>
                                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{venueFilter.length === 0 ? "Select venues..." : `${venueFilter.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent><DropdownMenuLabel>Venues</DropdownMenuLabel><DropdownMenuSeparator />{fields.map(field => (<DropdownMenuCheckboxItem key={field.fieldId} checked={venueFilter.includes(field.fieldId)} onCheckedChange={checked => setVenueFilter(prev => checked ? [...prev, field.fieldId] : prev.filter(id => id !== field.fieldId))}>{field.name}</DropdownMenuCheckboxItem>))}{venueFilter.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setVenueFilter([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4"><Label>Competition</Label>
                                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{competitionFilter.length === 0 ? "Select competitions..." : `${competitionFilter.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent><DropdownMenuLabel>Competitions</DropdownMenuLabel><DropdownMenuSeparator />{competitions.map(comp => (<DropdownMenuCheckboxItem key={comp.competitionId} checked={competitionFilter.includes(comp.competitionId)} onCheckedChange={checked => setCompetitionFilter(prev => checked ? [...prev, comp.competitionId] : prev.filter(id => id !== comp.competitionId))}>{comp.name}</DropdownMenuCheckboxItem>))}{competitionFilter.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setCompetitionFilter([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4"><Label>Status</Label>
                                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="col-span-2 h-8 justify-between font-normal"><span className="truncate">{statusFilter.length === 0 ? "Select statuses..." : `${statusFilter.length} selected`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent><DropdownMenuLabel>Statuses</DropdownMenuLabel><DropdownMenuSeparator />{['scheduled', 'live', 'completed', 'postponed'].map(status => (<DropdownMenuCheckboxItem key={status} checked={statusFilter.includes(status as MatchStatus)} onCheckedChange={checked => setStatusFilter(prev => checked ? [...prev, status as MatchStatus] : prev.filter(s => s !== status))}>{status}</DropdownMenuCheckboxItem>))}{statusFilter.length > 0 && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setStatusFilter([])}>Clear</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                 <div className="flex items-center rounded-md bg-muted p-1">
                  <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-1"><List className="h-4 w-4"/>List</Button>
                  <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('card')} className="gap-1"><LayoutGrid className="h-4 w-4"/>Card</Button>
                  <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('calendar')} className="gap-1"><Calendar className="h-4 w-4"/>Calendar</Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'list' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead className="hidden lg:table-cell">Competition</TableHead>
                    <TableHead className="hidden md:table-cell">Venue</TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('dateTime')} className="px-0 hover:bg-transparent">Date & Time {getSortIcon('dateTime')}</Button></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMatches.length > 0 ? (
                    paginatedMatches.map((match) => (
                      <TableRow key={match.matchId}>
                        <TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell>
                        <TableCell className="hidden lg:table-cell">{match.competitionName}</TableCell>
                        <TableCell className="hidden md:table-cell">{match.fieldName}</TableCell>
                        <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                        <TableCell><Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canAssignScorer && <DropdownMenuItem onSelect={() => { setMatchToAssignScorer(match); setIsAssignScorerDialogOpen(true); }}><User className="mr-2" />Assign Scorer</DropdownMenuItem>}
                              {isAdmin && <DropdownMenuItem onSelect={() => { setSelectedMatch(match); setIsEditDialogOpen(true); }}><Edit className="mr-2" />Edit</DropdownMenuItem>}
                              {isAdmin && <DropdownMenuItem onSelect={() => { setSelectedMatch(match); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2" />Delete</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">{filtersApplied ? "No matches found matching your filters." : "No matches found."}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {view === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedMatches.map((match) => (
                  <MatchCard 
                    key={match.matchId} 
                    match={match} 
                    onEdit={() => { setSelectedMatch(match); setIsEditDialogOpen(true); }}
                    onDelete={() => { setSelectedMatch(match); setIsDeleteDialogOpen(true); }}
                    onAssignScorer={() => { setMatchToAssignScorer(match); setIsAssignScorerDialogOpen(true); }}
                    isAdmin={isAdmin}
                    canAssignScorer={canAssignScorer}
                  />
                ))}
              </div>
            )}
            {view === 'calendar' && <MatchCalendar matches={matches} />}
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
      
      {isAdmin && selectedMatch && (
        <EditMatchDialog
            match={selectedMatch}
            teams={teams}
            competitions={competitions}
            fields={fields}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) setSelectedMatch(null);
            }}
        />
      )}
      
      {canAssignScorer && matchToAssignScorer && (
        <AssignOfficialDialog
          match={matchToAssignScorer}
          people={scorers}
          open={isAssignScorerDialogOpen}
          onOpenChange={(open) => {
            setIsAssignScorerDialogOpen(open);
            if (!open) setMatchToAssignScorer(null);
          }}
        />
      )}

      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the match and all of its associated data (lineups, officials, scorecards, etc.).</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMatch(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Match"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
