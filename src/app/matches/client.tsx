

'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Trash2, Edit, CalendarIcon, Search, List, LayoutGrid, CalendarDays, PlusCircle, ChevronDown } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Match, Team, Competition, Field, MatchStatus } from "@/lib/data";
import { deleteMatchAction, updateMatchAction } from '@/lib/actions/matches';
import { MatchCard } from "./match-card";
import { MatchCalendar } from "./match-calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fixtureSchema = z.object({
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  competitionId: z.string().optional(), // Optional for friendlies
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({ required_error: "A date for the match is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Please use HH:MM." }),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned']),
  statusReason: z.string().optional(),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

function EditMatchDialog({ match, teams, competitions, fields, open, onOpenChange }: { match: Match; teams: Team[]; competitions: Competition[]; fields: Field[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      competitionId: match.competitionId,
      fieldId: match.fieldId,
      dateTime: match.dateTime,
      time: format(match.dateTime, "HH:mm"),
      status: match.status,
      statusReason: match.statusReason || "",
    },
  });

  const teamAId = form.watch('teamAId');
  const teamBId = form.watch('teamBId');
  const status = form.watch('status');
  
  React.useEffect(() => {
    if (match) {
        form.reset({
            teamAId: match.teamAId, teamBId: match.teamBId, competitionId: match.competitionId, fieldId: match.fieldId, dateTime: match.dateTime, time: format(match.dateTime, "HH:mm"), status: match.status, statusReason: match.statusReason || "",
        });
    }
  }, [match, form]);

  function onSubmit(data: FixtureFormValues) {
    startTransition(async () => {
        try {
            const [hours, minutes] = data.time.split(':').map(Number);
            const combinedDateTime = new Date(data.dateTime);
            combinedDateTime.setHours(hours, minutes, 0, 0);

            const { time, ...rest } = data;
            const finalData = { ...rest, dateTime: combinedDateTime };

            await updateMatchAction(match.matchId, finalData);
            toast({ title: "Match Updated", description: "The match details have been successfully updated." });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update match.", variant: "destructive" });
        }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Edit Match</DialogTitle><DialogDescription>Update the details for this fixture. Click save when you're done.</DialogDescription></DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamBId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === teamAId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="competitionId" render={({ field }) => (<FormItem><FormLabel>Competition</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a competition" /></SelectTrigger></FormControl><SelectContent><SelectItem value="friendly">Friendly Match</SelectItem>{competitions.map((comp) => (<SelectItem key={comp.competitionId} value={comp.competitionId}>{comp.name} ({comp.seasonName})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="dateTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Match Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{MATCH_STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {['postponed', 'cancelled', 'abandoned'].includes(status) && (
                        <FormField control={form.control} name="statusReason" render={({ field }) => (<FormItem><FormLabel>Reason for Status</FormLabel><FormControl><Input placeholder="e.g., Bad weather" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}

const MATCH_STATUSES: MatchStatus[] = ['scheduled', 'live', 'completed', 'postponed', 'cancelled', 'abandoned'];

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
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [competitionFilter, setCompetitionFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Matches</h1>
            <p className="text-muted-foreground">View all scheduled, live, and completed matches.</p>
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
                <CardTitle>Match List</CardTitle>
                <CardDescription>A list of all matches in the system.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Search className="h-4 w-4" />
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
                 <div className="flex items-center rounded-md bg-muted p-1">
                    <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-1"><List className="h-4 w-4" /> List</Button>
                    <Button variant={view === 'card' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('card')} className="gap-1"><LayoutGrid className="h-4 w-4" /> Card</Button>
                    <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('calendar')} className="gap-1"><CalendarDays className="h-4 w-4" /> Calendar</Button>
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
                          <TableHead>Date</TableHead>
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
                        <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">{filtersApplied ? "No matches found matching your filters." : "No matches found. Get started by creating a new match."}</TableCell></TableRow>
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
                <MatchCalendar matches={filteredMatches} />
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

