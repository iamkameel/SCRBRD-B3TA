

'use client';

import * as React from "react";
import { ArrowLeft, MoreHorizontal, Trash2, Wand2, Edit, PlusCircle, CheckCircle, AlertTriangle, User, Calendar, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Person, PlayerStats, PlayerTeamAssignment, PlayerMatchPerformance, Team } from "@/lib/data";
import { removePersonLinkAction, generateAndSavePlayerPortraitAction } from "@/lib/actions/players";
import { addPlayerToRosterAction, updateRosterAssignmentAction, removeRosterAssignmentAction } from "@/lib/actions/teams";
import { AddLinkDialog } from "./add-link-dialog";
import { PlayerDevelopmentCard } from "./player-development-card";
import { ROLE_GROUPS } from "@/lib/roles";

// --- Dialog for Assigning a Person to a NEW Team ---
const assignTeamSchema = z.object({
  teamId: z.string({ required_error: "Please select a team." }),
  role: z.string({ required_error: "Please select a role." }),
  status: z.string({ required_error: "Please select a status." }),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});
type AssignTeamFormValues = z.infer<typeof assignTeamSchema>;
const TEAM_ASSIGNABLE_ROLES = ["Player", "Coach", "Assistant Coach", "Team Manager", "Trainer", "Physio", "Scorer"];
const STATUSES = ["active", "on_trial", "injured", "retired"];

function AssignTeamDialog({ person, teams, open, onOpenChange }: { person: Person, teams: Team[], open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const form = useForm<AssignTeamFormValues>({
        resolver: zodResolver(assignTeamSchema),
        defaultValues: { isCaptain: false, isViceCaptain: false, status: 'active', role: 'Player' },
    });
    
    React.useEffect(() => {
        if(open) form.reset({ isCaptain: false, isViceCaptain: false, status: 'active', role: 'Player', teamId: undefined });
    }, [open, form]);

    function onSubmit(data: AssignTeamFormValues) {
        startTransition(async () => {
            try {
                const { teamId, ...assignmentData } = data;
                await addPlayerToRosterAction(teamId, { personId: person.personId, ...assignmentData });
                toast({ title: "Assignment Successful", description: `${person.firstName} has been added to the team.` });
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not assign person.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent><DialogHeader><DialogTitle>Assign {person.firstName} to a Team</DialogTitle><DialogDescription>Select a team and define the role and status for this person.</DialogDescription></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="teamId" render={({ field }) => (<FormItem><FormLabel>Team</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger></FormControl><SelectContent>{teams.map(t => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{TEAM_ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="active" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <div className="flex items-center space-x-4 pt-2">
                        <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                        <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                    </div>
                    <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Assigning..." : "Assign to Team"}</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Dialog for EDITING a Person's Team Assignment ---
function EditTeamAssignmentDialog({ assignment, open, onOpenChange }: { assignment: PlayerTeamAssignment, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<Omit<PlayerTeamAssignment, 'teamId' | 'teamName' | 'personId' | 'personName' | 'assignmentId'>>({
    resolver: zodResolver(assignmentSchema.omit({ personId: true })),
    defaultValues: { role: assignment.role, status: assignment.status, isCaptain: assignment.isCaptain, isViceCaptain: assignment.isViceCaptain },
  });
  
  React.useEffect(() => {
    form.reset({ role: assignment.role, status: assignment.status, isCaptain: assignment.isCaptain, isViceCaptain: assignment.isViceCaptain });
  }, [assignment, form]);

  function onSubmit(data: any) {
    startTransition(async () => {
        try {
            await updateRosterAssignmentAction({ teamId: assignment.teamId, assignmentId: assignment.assignmentId, ...data });
            toast({ title: "Roster Updated", description: `The assignment has been updated.` });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update assignment.", variant: "destructive" });
        }
    });
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent><DialogHeader><DialogTitle>Edit Assignment: {assignment.teamName}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{TEAM_ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex items-center space-x-4 pt-2">
                <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
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


interface PersonDetailsClientProps {
    person: Person;
    playerStats: PlayerStats;
    initialGuardians: Person[];
    initialChildren: Person[];
    availablePeople: Person[];
    teamAssignments: PlayerTeamAssignment[];
    matchHistory: PlayerMatchPerformance[];
    allTeams: Team[];
    canManage: boolean;
}

export default function PersonDetailsClient({ person, playerStats, initialGuardians, initialChildren, availablePeople, teamAssignments, matchHistory, allTeams, canManage }: PersonDetailsClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isGeneratingPortrait, startPortraitGeneration] = React.useTransition();
  
  const [selectedLink, setSelectedLink] = React.useState<{linkedPerson: Person, relationship: 'guardian' | 'child'} | null>(null);
  const [isDeleteLinkDialogOpen, setIsDeleteLinkDialogOpen] = React.useState(false);

  const [assignmentToEdit, setAssignmentToEdit] = React.useState<PlayerTeamAssignment | null>(null);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = React.useState(false);

  const [assignmentToRemove, setAssignmentToRemove] = React.useState<PlayerTeamAssignment | null>(null);
  const [isRemoveAssignmentDialogOpen, setIsRemoveAssignmentDialogOpen] = React.useState(false);
  
  const [isAssignTeamDialogOpen, setIsAssignTeamDialogOpen] = React.useState(false);

  const handleRemoveLink = () => {
    if (!selectedLink) return;
    startTransition(async () => {
      try {
        await removePersonLinkAction(person.personId, selectedLink.linkedPerson.personId, selectedLink.relationship);
        toast({ title: "Link Removed", description: "The family link has been removed." });
        setIsDeleteLinkDialogOpen(false);
        setSelectedLink(null);
        router.refresh();
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove link.", variant: "destructive" });
        setIsDeleteLinkDialogOpen(false);
        setSelectedLink(null);
      }
    });
  }

  const handleGeneratePortrait = () => {
    startPortraitGeneration(async () => {
        try {
            await generateAndSavePlayerPortraitAction(person.personId);
            toast({ title: "Portrait Generated", description: "The new AI portrait has been saved."});
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate portrait.", variant: "destructive" });
        }
    });
  }

  const handleRemoveTeamAssignment = () => {
    if (!assignmentToRemove) return;
    startTransition(async () => {
        try {
            await removeRosterAssignmentAction(assignmentToRemove.teamId, assignmentToRemove.assignmentId);
            toast({ title: "Assignment Removed", description: `${person.firstName} was removed from ${assignmentToRemove.teamName}.`});
            setIsRemoveAssignmentDialogOpen(false);
            setAssignmentToRemove(null);
        } catch (error) {
             toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove assignment.", variant: "destructive" });
             setIsRemoveAssignmentDialogOpen(false);
             setAssignmentToRemove(null);
        }
    });
  };
  
  const groupedRoles = React.useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    person.roles.forEach(roleId => {
        const group = ROLE_GROUPS.find(g => g.roles.some(r => r.id === roleId));
        if (group) {
            if (!groups[group.group]) {
                groups[group.group] = [];
            }
            groups[group.group].push(roleId);
        }
    });
    return Object.entries(groups).map(([group, roles]) => ({ group, roles }));
  }, [person.roles]);

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <Link href="/people" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to People
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                      <AvatarImage src={person.profileImageUrl} />
                      <AvatarFallback className="text-3xl">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  {canManage && (
                      <Button 
                          size="icon" variant="outline"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background"
                          onClick={handleGeneratePortrait} disabled={isGeneratingPortrait}
                      >
                          <Wand2 className={`h-4 w-4 ${isGeneratingPortrait ? 'animate-spin' : ''}`} />
                          <span className="sr-only">Generate AI Portrait</span>
                      </Button>
                  )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.firstName} {person.lastName}</h1>
                    <p className="text-muted-foreground">{person.email}</p>
                </div>
            </div>
          </div>
        </header>

         <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assignments">Roles &amp; Assignments</TabsTrigger>
                <TabsTrigger value="history">Match History</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader><CardTitle>Player Statistics</CardTitle><CardDescription>Overall career statistics for all completed matches.</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="text-lg font-medium mb-4 text-primary">Batting</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                              <StatItem label="Matches" value={playerStats.matchesPlayed} /><StatItem label="Innings" value={playerStats.inningsBatted} /><StatItem label="Runs" value={playerStats.totalRuns} /><StatItem label="Highest" value={`${playerStats.highestScore}${playerStats.highestScoreNotOut ? '*' : ''}`} /><StatItem label="Average" value={playerStats.battingAverage.toFixed(2)} /><StatItem label="Strike Rate" value={playerStats.strikeRate.toFixed(2)} /><StatItem label="100s" value={playerStats.hundreds} /><StatItem label="50s" value={playerStats.fifties} />
                          </div>
                      </div>
                      <Separator />
                      <div>
                          <h3 className="text-lg font-medium mb-4 text-primary">Bowling</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                              <StatItem label="Overs" value={playerStats.oversBowled} /><StatItem label="Wickets" value={playerStats.wicketsTaken} /><StatItem label="Average" value={playerStats.bowlingAverage.toFixed(2)} /><StatItem label="Economy" value={playerStats.economyRate.toFixed(2)} /><StatItem label="Maidens" value={playerStats.maidens} /><StatItem label="Best" value={playerStats.bestBowling} /><StatItem label="Runs Conceded" value={playerStats.runsConceded} />
                          </div>
                      </div>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="assignments" className="mt-4 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Assigned Roles</CardTitle><CardDescription>A summary of all roles assigned to this person.</CardDescription></CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        {groupedRoles.map(({group, roles}) => (
                            <div key={group}>
                                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">{group}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {roles.map(role => <Badge key={role} className="capitalize">{role}</Badge>)}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Team Assignments</CardTitle>
                            <CardDescription>A list of teams {person.firstName} is assigned to.</CardDescription>
                        </div>
                        {canManage && <Button size="sm" onClick={() => setIsAssignTeamDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Assign to Team</Button>}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>{canManage && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                            <TableBody>{teamAssignments.length > 0 ? (teamAssignments.map(assignment => (
                                <TableRow key={assignment.assignmentId}>
                                    <TableCell className="font-medium"><Link href={`/teams/${assignment.teamId}`} className="hover:underline">{assignment.teamName}</Link></TableCell>
                                    <TableCell>{assignment.role}</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{assignment.status.replace(/_/g, " ")}</Badge></TableCell>
                                    {canManage && <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => { setAssignmentToEdit(assignment); setIsEditAssignmentDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => { setAssignmentToRemove(assignment); setIsRemoveAssignmentDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>}
                                </TableRow>
                            ))) : ( <TableRow><TableCell colSpan={canManage ? 4 : 3} className="h-24 text-center text-muted-foreground">Not assigned to any teams.</TableCell></TableRow> )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <Card>
                    <CardHeader><CardTitle>Recent Match History</CardTitle><CardDescription>A summary of the last 5 match performances.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Opponent</TableHead><TableHead>Batting</TableHead><TableHead>Bowling</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {matchHistory.length > 0 ? (
                                    matchHistory.map(perf => (
                                        <TableRow key={perf.matchId}>
                                            <TableCell>{format(perf.date, 'dd MMM yyyy')}</TableCell>
                                            <TableCell><Link href={`/matches/${perf.matchId}`} className="hover:underline">{perf.opponent}</Link></TableCell>
                                            <TableCell>{perf.battingStatus || 'DNB'}</TableCell>
                                            <TableCell>{perf.wicketsTaken !== undefined && perf.runsConceded !== undefined ? `${perf.wicketsTaken}/${perf.runsConceded}` : 'DNB'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No completed match history found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="development" className="mt-4">
                <PlayerDevelopmentCard 
                    personId={person.personId} 
                    initialPlan={person.developmentPlan ?? null}
                    initialPlanDate={person.developmentPlanGeneratedAt}
                />
            </TabsContent>
         </Tabs>
      </div>

      {canManage && <AssignTeamDialog person={person} teams={allTeams} open={isAssignTeamDialogOpen} onOpenChange={setIsAssignTeamDialogOpen} />}
      {canManage && assignmentToEdit && <EditTeamAssignmentDialog assignment={assignmentToEdit} open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen} />}
      
      {canManage && <AddLinkDialog currentPersonId={person.personId} availablePeople={availablePeople} />}

      <AlertDialog open={isDeleteLinkDialogOpen} onOpenChange={setIsDeleteLinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove the family link between {person.firstName} and {selectedLink?.linkedPerson.firstName}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLink(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLink} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Link"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isRemoveAssignmentDialogOpen} onOpenChange={setIsRemoveAssignmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove <strong>{person.firstName}</strong> from the <strong>{assignmentToRemove?.teamName}</strong> team. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssignmentToRemove(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTeamAssignment} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Assignment"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StatItem({ label, value }: { label: string, value: string | number }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
        </div>
    )
}
