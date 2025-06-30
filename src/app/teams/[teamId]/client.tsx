
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, ArrowLeft, Trash2, Edit, Search, Loader2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Team, Person, RosterMember, TeamStats, Match } from "@/lib/data";
import { addPlayerToRosterAction, removeRosterAssignmentAction, updateRosterAssignmentAction, getEligiblePlayersForTeam } from '@/lib/actions/teams';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
const STATUSES = ["active", "on_trial", "injured", "retired", "on_loan"];

function AddStaffDialog({ teamId, teamSchoolId, people, assignableRoles, open, onOpenChange, title, description }: { teamId: string, teamSchoolId: string, people: Person[], assignableRoles: string[], open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { isCaptain: false, isViceCaptain: false, status: "active", role: assignableRoles[0] },
  });
  
  const selectedRole = form.watch('role');

  const rolesRequiringSchoolAssignment = ['Coach', 'Assistant Coach', 'Team Manager', 'Trainer', 'Physiotherapist'];

  React.useEffect(() => {
    if (open) {
      form.reset({
        isCaptain: false, isViceCaptain: false, status: "active",
        role: assignableRoles[0], personId: undefined
      });
    }
  }, [open, assignableRoles, form]);

  React.useEffect(() => {
    form.resetField('personId');
  }, [selectedRole, form]);

  const filteredPeople = React.useMemo(() => {
    if (!selectedRole) return [];
    let peopleForRole = people.filter(p => p.roles.includes(selectedRole as string));
    if (rolesRequiringSchoolAssignment.includes(selectedRole as string)) {
        peopleForRole = peopleForRole.filter(p => p.assignedSchools?.includes(teamSchoolId));
    }
    return peopleForRole;
  }, [people, selectedRole, teamSchoolId]);

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
            {assignableRoles.length > 1 ? (
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{assignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            ) : (
              <div><Label>Role</Label><Input value={assignableRoles[0]} disabled /></div>
            )}
            
            <FormField control={form.control} name="personId" render={({ field }) => (
                <FormItem><FormLabel>Person</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isPending || !selectedRole}>
                        <FormControl><SelectTrigger><SelectValue placeholder={!selectedRole ? "Select a role first" : "Select a person"} /></SelectTrigger></FormControl>
                        <SelectContent>{filteredPeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                </FormItem>
            )} />
            
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

function AddPlayerDialog({ team, open, onOpenChange }: { team: Team, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isSubmitting, startSubmitTransition] = React.useTransition();
    const [isLoading, setIsLoading] = React.useState(true);
    const [eligiblePlayers, setEligiblePlayers] = React.useState<(Person & { eligibilityContext: string })[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    const form = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: { role: 'Player', isCaptain: false, isViceCaptain: false, status: "active" },
    });

    React.useEffect(() => {
        if (open) {
            setIsLoading(true);
            setEligiblePlayers([]);
            setSearchTerm('');
            form.reset({ role: 'Player', isCaptain: false, isViceCaptain: false, status: 'active', personId: undefined });

            getEligiblePlayersForTeam(team.teamId)
                .then(players => {
                    setEligiblePlayers(players);
                })
                .catch(() => toast({ title: "Error", description: "Could not load eligible players.", variant: "destructive" }))
                .finally(() => setIsLoading(false));
        }
    }, [open, team.teamId, toast, form]);
    
    const filteredPlayers = eligiblePlayers.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

    function onSubmit(data: AssignmentFormValues) {
        startSubmitTransition(async () => {
            try {
                await addPlayerToRosterAction(team.teamId, data);
                toast({ title: "Player Added", description: `The player has been added to the team.` });
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not add player to roster.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add Player to {team.name}</DialogTitle><DialogDescription>Select an eligible player to add to the roster.</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="personId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Eligible Players</FormLabel>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search eligible players..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <ScrollArea className="h-64 rounded-md border">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading eligible players...
                                        </div>
                                    ) : (
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="p-2 space-y-1">
                                            {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
                                              <FormItem key={p.personId} className="flex items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-muted/50 has-[:checked]:bg-muted">
                                                <FormControl>
                                                  <RadioGroupItem value={p.personId} id={p.personId} />
                                                </FormControl>
                                                <FormLabel htmlFor={p.personId} className="font-normal w-full cursor-pointer">
                                                    <p>{p.firstName} {p.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{p.eligibilityContext}</p>
                                                </FormLabel>
                                              </FormItem>
                                            )) : (
                                                <p className="text-center text-sm text-muted-foreground p-4">No eligible players found.</p>
                                            )}
                                        </RadioGroup>
                                    )}
                                </ScrollArea>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="active" disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        
                        <div className="flex items-center space-x-4 pt-2">
                            <FormField control={form.control} name="isCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div></FormItem>)} />
                            <FormField control={form.control} name="isViceCaptain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div></FormItem>)} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Player to Team"}</Button>
                        </DialogFooter>
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
  canManage: boolean;
}

export default function TeamDetailsClient({ team, initialRoster, people, teamStats, teamMatches, canManage }: TeamDetailsClientProps) {
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedMember, setSelectedMember] = React.useState<RosterMember | null>(null);
  const [memberToEdit, setMemberToEdit] = React.useState<RosterMember | null>(null);
  
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = React.useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const playerRoster = initialRoster.filter(m => PLAYER_ROLES.includes(m.role));
  const staffRoster = initialRoster.filter(m => STAFF_ROLES.includes(m.role));

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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    {team.teamColors && (
                      <div className="relative h-16 w-16 rounded-full border-2 border-border flex items-center justify-center bg-muted">
                        <div className="absolute h-full w-1/2 left-0 rounded-l-full" style={{ backgroundColor: team.teamColors.primary }} />
                        <div className="absolute h-full w-1/2 right-0 rounded-r-full" style={{ backgroundColor: team.teamColors.secondary }}/>
                      </div>
                    )}
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">{team.name}</h1>
                      <p className="text-muted-foreground">
                        {team.alias && <span className="font-semibold text-foreground">{team.alias} &bull; </span>}
                        {team.divisionName} &bull; {team.schoolName} &bull; {team.seasonName}
                      </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Played</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{teamStats.matchesPlayed}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Won</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{teamStats.matchesWon}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Lost</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{teamStats.matchesLost}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">NRR</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{teamStats.netRunRate.toFixed(2)}</p></CardContent>
                </Card>
            </div>
        </div>
        
        <Tabs defaultValue="roster">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roster">Roster</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="roster" className="mt-4 space-y-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Player Roster</CardTitle><CardDescription>The main squad of players for the team.</CardDescription></div>
                    {canManage && <Button onClick={() => setIsAddPlayerDialogOpen(true)}><PlusCircle className="mr-2" />Add Player</Button>}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead>
                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {playerRoster.length > 0 ? (
                          playerRoster.map(member => (
                            <TableRow key={member.assignmentId}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <Link href={`/people/${member.personId}`} className="hover:underline">{member.personName}</Link>
                                {member.isCaptain && <TooltipProvider><Tooltip><TooltipTrigger><Badge variant="outline" className="text-amber-500 border-amber-500">C</Badge></TooltipTrigger><TooltipContent><p>Captain</p></TooltipContent></Tooltip></TooltipProvider>}
                                {member.isViceCaptain && <TooltipProvider><Tooltip><TooltipTrigger><Badge variant="outline">VC</Badge></TooltipTrigger><TooltipContent><p>Vice-Captain</p></TooltipContent></Tooltip></TooltipProvider>}
                              </TableCell>
                              <TableCell><Badge variant="secondary" className="capitalize">{member.status.replace(/_/g, " ")}</Badge></TableCell>
                              {canManage && <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setMemberToEdit(member); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">No players assigned to this roster yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Team Staff</CardTitle><CardDescription>Manage the coaches and support staff for this team.</CardDescription></div>
                    {canManage && <Button onClick={() => setIsAddStaffDialogOpen(true)}><PlusCircle className="mr-2" />Add Staff</Button>}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead>
                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffRoster.length > 0 ? (
                          staffRoster.map(member => (
                            <TableRow key={member.assignmentId}>
                              <TableCell className="font-medium"><Link href={`/people/${member.personId}`} className="hover:underline">{member.personName}</Link></TableCell>
                              <TableCell>{member.role}</TableCell>
                              {canManage && <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => { setMemberToEdit(member); setIsEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">No staff assigned to this team yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="schedule" className="mt-4">
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
            </TabsContent>
        </Tabs>
      </div>
      
      {canManage && <AddPlayerDialog 
        team={team}
        open={isAddPlayerDialogOpen} 
        onOpenChange={setIsAddPlayerDialogOpen} 
      />}
      {canManage && <AddStaffDialog 
        teamId={team.teamId}
        teamSchoolId={team.schoolId} 
        people={people} 
        assignableRoles={STAFF_ROLES} 
        open={isAddStaffDialogOpen} 
        onOpenChange={setIsAddStaffDialogOpen}
        title="Add Staff to Team"
        description="Assign a new staff member to the team."
      />}

      {canManage && memberToEdit && (
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

      {canManage && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{selectedMember?.personName}</strong> from the team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Member"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  )
}
