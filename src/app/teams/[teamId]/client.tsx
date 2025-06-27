

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, ArrowLeft, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Team, Person, RosterMember, TeamStats, Match } from "@/lib/data";
import { addPlayerToRosterAction, removeRosterAssignmentAction, updateRosterAssignmentAction } from '@/lib/actions/teams';

const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
  status: z.string({ required_error: "Please select a status." }),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

const editAssignmentSchema = assignmentSchema.omit({ personId: true });
type EditAssignmentFormValues = z.infer<typeof editAssignmentSchema>;

const PLAYER_ROLES = ["Player"];
const STAFF_ROLES = ["Coach", "Assistant Coach", "Team Manager", "Trainer", "Physio", "Scorer"];
const TEAM_ASSIGNABLE_ROLES = [...PLAYER_ROLES, ...STAFF_ROLES];
const STATUSES = ["active", "on_trial", "injured", "retired"];

function AddAssignmentDialog({ teamId, people, assignableRoles, open, onOpenChange, title, description }: { teamId: string, people: Person[], assignableRoles: string[], open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { isCaptain: false, isViceCaptain: false, status: "active", role: assignableRoles[0] },
  });
  
  React.useEffect(() => {
    if (open) {
      form.reset({
        isCaptain: false,
        isViceCaptain: false,
        status: "active",
        role: assignableRoles[0],
        personId: undefined
      });
    }
  }, [open, assignableRoles, form]);

  function onSubmit(data: AssignmentFormValues) {
    startTransition(async () => {
        try {
            await addPlayerToRosterAction(teamId, data);
            toast({ title: "Person Added to Roster", description: `The person has been added to the team.` });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not add person to roster.", variant: "destructive" });
        }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="personId" render={({ field }) => (<FormItem><FormLabel>Person</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl><SelectContent>{people.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            
            {assignableRoles.length > 1 ? (
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{assignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            ) : (
              <div><Label>Role</Label><Input value={assignableRoles[0]} disabled /></div>
            )}
            
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="active" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            
            {assignableRoles.includes("Player") && (
                <div className="flex items-center space-x-4 pt-2">
                <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                </div>
            )}
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add to Team"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditAssignmentDialog({ teamId, member, open, onOpenChange }: { teamId: string; member: RosterMember; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<EditAssignmentFormValues>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: {
        role: member.role, status: member.status, isCaptain: member.isCaptain, isViceCaptain: member.isViceCaptain,
    },
  });

  React.useEffect(() => {
    form.reset({
        role: member.role, status: member.status, isCaptain: member.isCaptain, isViceCaptain: member.isViceCaptain,
    });
  }, [member, form]);

  function onSubmit(data: EditAssignmentFormValues) {
    startTransition(async () => {
        try {
            await updateRosterAssignmentAction({ teamId, assignmentId: member.assignmentId, ...data });
            toast({ title: "Roster Updated", description: `${member.personName}'s assignment has been updated.` });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update assignment.", variant: "destructive" });
        }
    });
  }
  
  const isPlayer = member.role === 'Player';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Edit Assignment for {member.personName}</DialogTitle><DialogDescription>Update the role and status on this team.</DialogDescription></DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label>Person</Label>
                        <Input value={member.personName} disabled />
                    </div>
                    <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{TEAM_ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    
                    {isPlayer && (
                        <div className="flex items-center space-x-4 pt-2">
                            <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                            <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                        </div>
                    )}
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

interface TeamDetailsClientProps {
  team: Team;
  initialRoster: RosterMember[];
  people: Person[];
  teamStats: TeamStats;
  teamMatches: Match[];
}

export default function TeamDetailsClient({ team, initialRoster, people, teamStats, teamMatches }: TeamDetailsClientProps) {
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedMember, setSelectedMember] = React.useState<RosterMember | null>(null);
  const [memberToEdit, setMemberToEdit] = React.useState<RosterMember | null>(null);
  
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = React.useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const playerRoster = initialRoster.filter(m => m.role === 'Player');
  const staffRoster = initialRoster.filter(m => m.role !== 'Player');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRemove = () => {
    if (!selectedMember) return;
    startTransition(async () => {
      try {
        await removeRosterAssignmentAction(team.teamId, selectedMember.assignmentId);
        toast({ title: "Member Removed", description: `${selectedMember.personName} has been removed from the roster.` });
        setIsDeleteDialogOpen(false);
        setSelectedMember(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not remove member from roster.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedMember(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to Teams</Link>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
              <div><CardTitle>{team.name}</CardTitle><CardDescription>{team.divisionName} &bull; {team.schoolName} &bull; {team.seasonName}</CardDescription></div>
              {team.teamColors && (
              <div className="flex items-center gap-2">
                  {team.teamColors.primary && (<TooltipProvider><Tooltip><TooltipTrigger asChild><div className="h-8 w-8 rounded-full border" style={{ backgroundColor: team.teamColors.primary }} /></TooltipTrigger><TooltipContent><p>Primary: {team.teamColors.primary}</p></TooltipContent></Tooltip></TooltipProvider>)}
                  {team.teamColors.secondary && (<TooltipProvider><Tooltip><TooltipTrigger asChild><div className="h-8 w-8 rounded-full border" style={{ backgroundColor: team.teamColors.secondary }}/></TooltipTrigger><TooltipContent><p>Secondary: {team.teamColors.secondary}</p></TooltipContent></Tooltip></TooltipProvider>)}
              </div>
              )}
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Player Roster</CardTitle><CardDescription>The main squad of players for the team.</CardDescription></div>
            <Button onClick={() => setIsAddPlayerDialogOpen(true)}><PlusCircle className="mr-2" />Add Player</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {playerRoster.length > 0 ? (
                  playerRoster.map(member => (
                    <TableRow key={member.assignmentId}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Link href={`/people/${member.personId}`} className="hover:underline">{member.personName}</Link>
                        {member.isCaptain && <Badge variant="outline" className="ml-2">C</Badge>}
                        {member.isViceCaptain && <Badge variant="outline" className="ml-2">VC</Badge>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{member.status.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setMemberToEdit(member); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center">No players assigned to this roster yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Team Staff</CardTitle><CardDescription>Manage the coaches and support staff for this team.</CardDescription></div>
            <Button onClick={() => setIsAddStaffDialogOpen(true)}><PlusCircle className="mr-2" />Add Staff</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {staffRoster.length > 0 ? (
                  staffRoster.map(member => (
                    <TableRow key={member.assignmentId}>
                      <TableCell className="font-medium"><Link href={`/people/${member.personId}`} className="hover:underline">{member.personName}</Link></TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setMemberToEdit(member); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center">No staff assigned to this team yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Match Schedule & Results</CardTitle>
                <CardDescription>A list of all scheduled and completed matches for {team.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Opponent</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMatches.length > 0 ? (
                            teamMatches.map(match => {
                                const opponentName = match.teamAId === team.teamId ? match.teamBName : match.teamAName;
                                return (
                                    <TableRow key={match.matchId}>
                                        <TableCell className="font-medium">
                                            <Link href={`/matches/${match.matchId}`} className="hover:underline">
                                                vs {opponentName}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{isClient ? format(match.dateTime, "PPP p") : '\u00A0'}</TableCell>
                                        <TableCell>{match.fieldName}</TableCell>
                                        <TableCell>
                                            <Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">
                                                {match.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No matches scheduled for this team yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Team Statistics</CardTitle><CardDescription>Overall performance for all completed matches in this season.</CardDescription></CardHeader>
          <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                  <StatItem label="Played" value={teamStats.matchesPlayed} /><StatItem label="Won" value={teamStats.matchesWon} /><StatItem label="Lost" value={teamStats.matchesLost} /><StatItem label="Drawn" value={teamStats.matchesDrawn} /><StatItem label="Runs Scored" value={teamStats.totalRunsScored} /><StatItem label="Wickets Taken" value={teamStats.totalWicketsTaken} /><StatItem label="Net Run Rate" value={teamStats.netRunRate.toFixed(2)} />
              </div>
          </CardContent>
        </Card>
      </div>
      
      <AddAssignmentDialog 
        teamId={team.teamId} 
        people={people} 
        assignableRoles={PLAYER_ROLES} 
        open={isAddPlayerDialogOpen} 
        onOpenChange={setIsAddPlayerDialogOpen} 
        title="Add Player to Roster" 
        description="Assign a new player to the team." 
      />
      <AddAssignmentDialog 
        teamId={team.teamId} 
        people={people} 
        assignableRoles={STAFF_ROLES} 
        open={isAddStaffDialogOpen} 
        onOpenChange={setIsAddStaffDialogOpen}
        title="Add Staff to Team"
        description="Assign a new staff member to the team."
      />

      {memberToEdit && (
        <EditAssignmentDialog
          teamId={team.teamId}
          member={memberToEdit}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setMemberToEdit(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove <strong>{selectedMember?.personName}</strong> from the team. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Member"}</AlertDialogAction>
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
