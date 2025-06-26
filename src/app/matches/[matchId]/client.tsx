
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Calendar, Clock, Trash2, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { assignOfficialToMatchAction, saveMatchLineupAction, removeOfficialFromMatchAction, generateAndSaveScorecardAction, generateMatchSummaryAction } from '@/lib/actions/matches';
import type { Match, Person, Official, Innings, RosterMember } from "@/lib/data";
import { Scorecard } from "./scorecard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

const ROLES = ["Umpire", "Scorer"];

function AssignOfficialDialog({ matchId, people }: { matchId: string, people: Person[]}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { role: "Umpire" },
  });

  function onSubmit(data: AssignmentFormValues) {
    startTransition(async () => {
      try {
        await assignOfficialToMatchAction(matchId, data);
        toast({
          title: "Official Assigned",
          description: `The person has been assigned to the match.`,
        });
        setOpen(false);
        form.reset();
        router.refresh();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isPending}>
          <PlusCircle className="mr-2" />
          Assign Official
        </Button>
      </DialogTrigger>
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
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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

const lineupSchema = z.object({
  playerIds: z.array(z.string()).refine(value => value.length > 0, {
    message: "You must select at least one player.",
  }).refine(value => value.length <= 11, {
    message: "You can select a maximum of 11 players."
  }),
});

type LineupFormValues = z.infer<typeof lineupSchema>;

interface LineupSelectionCardProps {
  teamId: string;
  teamName: string;
  matchId: string;
  roster: RosterMember[];
  lineup: string[];
}

function LineupSelectionCard({ teamId, teamName, matchId, roster, lineup }: LineupSelectionCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<LineupFormValues>({
    resolver: zodResolver(lineupSchema),
    defaultValues: {
      playerIds: lineup || [],
    },
  });

  function onSubmit(data: LineupFormValues) {
    startTransition(async () => {
      try {
        await saveMatchLineupAction(matchId, teamId, data.playerIds);
        toast({
          title: "Lineup Saved",
          description: `The lineup for ${teamName} has been updated.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not save lineup.",
          variant: "destructive",
        });
      }
    });
  }

  const selectedCount = form.watch('playerIds')?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{teamName} - Select Lineup ({selectedCount}/11)</CardTitle>
        <CardDescription>Select the 11 players for this match.</CardDescription>
      </CardHeader>
      <CardContent>
        {roster.length > 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="playerIds"
                render={() => (
                  <FormItem className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {roster.map((member) => (
                        <FormField
                          key={member.personId}
                          control={form.control}
                          name="playerIds"
                          render={({ field }) => (
                            <FormItem key={member.personId} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(member.personId)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, member.personId])
                                      : field.onChange(field.value?.filter((id) => id !== member.personId));
                                  }}
                                  disabled={isPending}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex flex-col">
                                {member.personName}
                                <span className="text-xs text-muted-foreground">{member.role}</span>
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : `Save ${teamName} Lineup`}
              </Button>
            </form>
          </Form>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No players on this team's roster. Add players on the <Link href={`/teams/${teamId}`} className="underline">team page</Link>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScorecardPlaceholder() {
  return (
    <div className="text-center text-muted-foreground py-8 px-4">
        <p className="font-semibold">No scorecard exists for this match yet.</p>
        <p>Select 11 players for each team's lineup to enable scorecard generation.</p>
    </div>
  );
}

interface MatchDetailsClientProps {
  match: Match;
  initialOfficials: Official[];
  people: Person[];
  teamARoster: RosterMember[];
  teamBRoster: RosterMember[];
  teamALineup: string[];
  teamBLineup: string[];
  innings1?: Innings;
  innings2?: Innings;
}

export default function MatchDetailsClient({ match, initialOfficials, people, teamARoster, teamBRoster, teamALineup, teamBLineup, innings1, innings2 }: MatchDetailsClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isGenerating, startGenerationTransition] = React.useTransition();
  const [isGeneratingSummary, startSummaryGeneration] = React.useTransition();
  const [selectedOfficial, setSelectedOfficial] = React.useState<Official | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleRemoveOfficial = () => {
    if (!selectedOfficial) return;
    startTransition(async () => {
      try {
        await removeOfficialFromMatchAction(match.matchId, selectedOfficial.assignmentId);
        toast({ title: "Official Removed", description: `${selectedOfficial.personName} has been removed from the match.` });
        setIsDeleteDialogOpen(false);
        setSelectedOfficial(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove official.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedOfficial(null);
      }
    });
  };

  const handleGenerateScorecard = () => {
    startGenerationTransition(async () => {
        try {
            const result = await generateAndSaveScorecardAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate scorecard.", variant: "destructive" });
        }
    });
  };
  
  const handleGenerateSummary = () => {
    startSummaryGeneration(async () => {
        try {
            const result = await generateMatchSummaryAction(match.matchId);
            toast({ title: "Success", description: result.message });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate summary.", variant: "destructive" });
        }
    });
  };


  const firstInnings = innings1?.teamName === match.teamAName ? innings1 : (innings2?.teamName === match.teamAName ? innings2 : undefined);
  const secondInnings = innings1?.teamName === match.teamBName ? innings1 : (innings2?.teamName === match.teamBName ? innings2 : undefined);
  const canGenerateScorecard = teamALineup.length === 11 && teamBLineup.length === 11;


  return (
    <>
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{match.teamAName} vs {match.teamBName}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(match.dateTime, "PPPP")}</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {format(match.dateTime, "p")}</span>
              <span>{match.fieldName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
              <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="team-a-innings">
          <Card>
              <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                          <CardTitle>Scorecard</CardTitle>
                          <CardDescription>Detailed match scorecard for both innings.</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                          {!innings1 ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-block">
                                            <Button onClick={handleGenerateScorecard} disabled={!canGenerateScorecard || isGenerating}>
                                                <RefreshCcw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                {isGenerating ? "Generating..." : "Generate Scorecard"}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!canGenerateScorecard && (
                                        <TooltipContent>
                                            <p>Select 11 players for each team to enable generation.</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" disabled={isGenerating}>
                                        <RefreshCcw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                        {isGenerating ? "Regenerating..." : "Regenerate Scorecard"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will generate a new scorecard, permanently overwriting the current one. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleGenerateScorecard}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? "Regenerating..." : "Yes, Regenerate"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {innings1 && (
                            <TabsList>
                                <TabsTrigger value="team-a-innings">{match.teamAName}</TabsTrigger>
                                <TabsTrigger value="team-b-innings">{match.teamBName}</TabsTrigger>
                            </TabsList>
                          )}
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <TabsContent value="team-a-innings">
                      {firstInnings ? <Scorecard innings={firstInnings} /> : <ScorecardPlaceholder />}
                  </TabsContent>
                  <TabsContent value="team-b-innings">
                      {secondInnings ? <Scorecard innings={secondInnings} /> : <ScorecardPlaceholder />}
                  </TabsContent>
              </CardContent>
          </Card>
        </Tabs>
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Match Summary</CardTitle>
                        <CardDescription>A journalistic summary of the match highlights.</CardDescription>
                    </div>
                    {innings1 && (
                         <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                            <RefreshCcw className={`mr-2 h-4 w-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                            {isGeneratingSummary ? "Generating..." : (match.summary ? "Regenerate" : "Generate")}
                         </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {match.summary ? (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{match.summary}</p>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No summary has been generated for this match yet.</p>
                        {innings1 && <p className="text-xs">Click the button above to generate one with AI.</p>}
                        {!innings1 && <p className="text-xs">A summary can be generated once a scorecard exists.</p>}
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LineupSelectionCard teamId={match.teamAId} teamName={match.teamAName} matchId={match.matchId} roster={teamARoster} lineup={teamALineup} />
          <LineupSelectionCard teamId={match.teamBId} teamName={match.teamBName} matchId={match.matchId} roster={teamBRoster} lineup={teamBLineup} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Match Officials</CardTitle>
              <CardDescription>Manage the umpires and scorers assigned to this match.</CardDescription>
            </div>
            <AssignOfficialDialog matchId={match.matchId} people={people} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialOfficials.length > 0 ? (
                  initialOfficials.map(official => (
                    <TableRow key={official.assignmentId}>
                      <TableCell className="font-medium">{official.personName}</TableCell>
                      <TableCell>{official.role}</TableCell>
                      <TableCell><Badge variant={official.confirmed ? 'secondary' : 'outline'}>{official.confirmed ? 'Confirmed' : 'Pending'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedOfficial(official); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No officials assigned to this match yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will remove <strong>{selectedOfficial?.personName}</strong> from this match. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOfficial(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveOfficial} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Official"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
