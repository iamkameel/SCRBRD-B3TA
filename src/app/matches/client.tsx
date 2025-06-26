
'use client';

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Trash2, Edit, CalendarIcon, Search } from "lucide-react";
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
import type { Match, Team, Season, Field } from "@/lib/data";
import { deleteMatchAction, updateMatchAction } from "@/lib/actions/matches";


const fixtureSchema = z.object({
  teamAId: z.string({ required_error: "Please select the home team." }),
  teamBId: z.string({ required_error: "Please select the away team." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  fieldId: z.string({ required_error: "Please select a field." }),
  dateTime: z.date({ required_error: "A date for the match is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Please use HH:MM." }),
}).refine(data => data.teamAId !== data.teamBId, {
  message: "Home and away teams cannot be the same.",
  path: ["teamBId"],
});

type FixtureFormValues = z.infer<typeof fixtureSchema>;

function EditMatchDialog({ match, teams, seasons, fields, open, onOpenChange }: { match: Match; teams: Team[]; seasons: Season[]; fields: Field[]; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      seasonId: match.seasonId,
      fieldId: match.fieldId,
      dateTime: match.dateTime,
      time: format(match.dateTime, "HH:mm"),
    },
  });
  
  React.useEffect(() => {
    if (match) {
        form.reset({
            teamAId: match.teamAId, teamBId: match.teamBId, seasonId: match.seasonId, fieldId: match.fieldId, dateTime: match.dateTime, time: format(match.dateTime, "HH:mm"),
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
                    <FormField control={form.control} name="teamAId" render={({ field }) => (<FormItem><FormLabel>Home Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="teamBId" render={({ field }) => (<FormItem><FormLabel>Away Team</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map((team) => (<SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="seasonId" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a season" /></SelectTrigger></FormControl><SelectContent>{seasons.map((season) => (<SelectItem key={season.seasonId} value={season.seasonId}>{season.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fieldId" render={({ field }) => (<FormItem><FormLabel>Venue / Field</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger></FormControl><SelectContent>{fields.map((field) => (<SelectItem key={field.fieldId} value={field.fieldId}>{field.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField control={form.control} name="dateTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Match Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
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

const MATCH_STATUSES = ['scheduled', 'live', 'completed', 'cancelled'];

export default function MatchesClient({ matches, teams, seasons, fields }: { matches: Match[], teams: Team[], seasons: Season[], fields: Field[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [matchToDelete, setMatchToDelete] = React.useState<Match | null>(null);
  const [matchToEdit, setMatchToEdit] = React.useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [seasonFilter, setSeasonFilter] = React.useState("all");

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

  const filteredMatches = matches.filter(match => {
    const matchesSearch = `${match.teamAName} ${match.teamBName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    const matchesSeason = seasonFilter === 'all' || match.seasonId === seasonFilter;
    return matchesSearch && matchesStatus && matchesSeason;
  });

  const filtersApplied = searchQuery || statusFilter !== 'all' || seasonFilter !== 'all';
  
  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Matches</h1>
            <p className="text-muted-foreground">View all scheduled, live, and completed matches.</p>
          </div>
          <Button asChild><Link href="/new-match">Create New Match</Link></Button>
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Match List</CardTitle>
                <CardDescription>A list of all matches in the system.</CardDescription>
              </div>
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
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filter Matches</h4>
                      <p className="text-sm text-muted-foreground">
                        Find matches by team, status, or season.
                      </p>
                    </div>
                    <div className="grid gap-4">
                       <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="search-input">Team</Label>
                        <Input
                          id="search-input"
                          placeholder="Team name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="col-span-2 h-8"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="status-filter">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="col-span-2 h-8 capitalize">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {MATCH_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="season-filter">Season</Label>
                         <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                            <SelectTrigger className="col-span-2 h-8"><SelectValue placeholder="All Seasons"/></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Seasons</SelectItem>
                              {seasons.map(s => <SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <TableRow key={match.matchId}>
                      <TableCell className="font-medium">
                        <Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link>
                      </TableCell>
                      <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                      <TableCell>{match.fieldName}</TableCell>
                      <TableCell><Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setMatchToEdit(match); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setMatchToDelete(match); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">
                    {filtersApplied ? "No matches found matching your filters." : "No matches found. Get started by creating a new match."}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {matchToEdit && (
        <EditMatchDialog 
            match={matchToEdit} 
            teams={teams} 
            seasons={seasons} 
            fields={fields} 
            open={isEditDialogOpen} 
            onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setMatchToEdit(null); }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      </AlertDialog>
    </>
  );
}
