
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, ArrowLeft, Trash2, Edit, Search, Loader2, BrainCircuit } from "lucide-react";
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
import { addPlayerToRosterAction, removeRosterAssignmentAction, updateRosterAssignmentAction, getEligiblePlayersForTeam, bulkAddPlayersToRosterAction } from '@/lib/actions/teams';
import { generateOppositionAnalysisAction } from '@/lib/actions/analysis';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
const STAFF_ROLES = ["Coach", "Assistant Coach", "Team Manager", "Trainer", "Physiotherapist", "Scorer"];
const TEAM_ASSIGNABLE_ROLES = [...PLAYER_ROLES, ...STAFF_ROLES];
const STATUSES = ["active", "on_trial", "injured", "retired", "on_loan"];

function AddStaffDialog({ teamId, people, assignableRoles, open, onOpenChange, title, description }: { teamId: string, people: Person[], assignableRoles: string[], open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [searchTerm, setSearchTerm] = React.useState('');

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { isCaptain: false, isViceCaptain: false, status: "active", role: assignableRoles[0] },
  });
  
  const selectedRole = form.watch('role');

  React.useEffect(() => {
    if (open) {
      form.reset({
        isCaptain: false, isViceCaptain: false, status: "active",
        role: assignableRoles[0], personId: undefined
      });
      setSearchTerm('');
    }
  }, [open, assignableRoles, form]);

  React.useEffect(() => {
    form.resetField('personId');
    setSearchTerm('');
  }, [selectedRole, form]);

  const filteredPeople = React.useMemo(() => {
    if (!selectedRole) return [];
    
    let peopleForRole = people.filter(p => p.roles.includes(selectedRole as string));
    
    if (searchTerm) {
        return peopleForRole.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    return peopleForRole;
  }, [people, selectedRole, searchTerm]);

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
                <FormItem>
                    <FormLabel>Person</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isPending || !selectedRole}
                        />
                    </div>
                    <ScrollArea className="h-60 rounded-md border">
                         <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="p-2"
                        >
                            {filteredPeople.length > 0 ? filteredPeople.map(p => (
                                <FormItem key={p.personId} className="flex items-center space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md">
                                    <FormControl>
                                        <RadioGroupItem value={p.personId} id={`person-${p.personId}`} />
                                    </FormControl>
                                    <Label htmlFor={`person-${p.personId}`} className="font-normal w-full cursor-pointer">
                                        {p.firstName} {p.lastName}
                                    </Label>
                                </FormItem>
                            )) : (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                    {searchTerm ? 'No matching people found.' : 'No eligible people for this role.'}
                                </p>
                            )}
                        </RadioGroup>
                    </ScrollArea>
                    <FormMessage />
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


const bulkAddPlayersSchema = z.object({
  playerIds: z.array(z.string()).min(1, { message: "Please select at least one player." }),
  status: z.string().default('active'),
});

function BulkAddPlayerDialog({ team, open, onOpenChange }: { team: Team, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isSubmitting, startSubmitTransition] = React.useTransition();
    const [isLoading, setIsLoading] = React.useState(true);
    const [eligiblePlayers, setEligiblePlayers] = React.useState<(Person & { eligibilityContext: string })[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    const form = useForm<z.infer<typeof bulkAddPlayersSchema>>({
        resolver: zodResolver(bulkAddPlayersSchema),
        defaultValues: { playerIds: [], status: "active" },
    });

    React.useEffect(() => {
        if (open) {
            setIsLoading(true);
            setEligiblePlayers([]);
            setSearchTerm('');
            form.reset({ playerIds: [], status: "active" });

            getEligiblePlayersForTeam(team.teamId)
                .then(players => {
                    setEligiblePlayers(players);
                })
                .catch(() => toast({ title: "Error", description: "Could not load eligible players.", variant: "destructive" }))
                .finally(() => setIsLoading(false));
        }
    }, [open, team.teamId, toast, form]);
    
    const filteredPlayers = eligiblePlayers.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

    function onSubmit(data: z.infer<typeof bulkAddPlayersSchema>) {
        startSubmitTransition(async () => {
            try {
                await bulkAddPlayersToRosterAction(team.teamId, data);
                toast({ title: "Players Added", description: `${data.playerIds.length} player(s) have been added to the team.` });
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not add players to roster.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add Players to {team.name}</DialogTitle><DialogDescription>Select one or more eligible players to add to the roster.</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="playerIds" render={() => (
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
                                        <div className="p-2 space-y-1">
                                            {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
                                              <FormField
                                                key={p.personId}
                                                control={form.control}
                                                name="playerIds"
                                                render={({ field }) => {
                                                  return (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 has-[:checked]:bg-muted">
                                                      <FormControl>
                                                        <Checkbox
                                                          checked={field.value?.includes(p.personId)}
                                                          onCheckedChange={(checked) => {
                                                            return checked
                                                              ? field.onChange([...(field.value || []), p.personId])
                                                              : field.onChange(
                                                                  field.value?.filter(
                                                                    (value) => value !== p.personId
                                                                  )
                                                                )
                                                          }}
                                                        />
                                                      </FormControl>
                                                      <FormLabel className="font-normal w-full cursor-pointer">
                                                        <p>{p.firstName} {p.lastName}</p>
                                                        <p className="text-xs text-muted-foreground">{p.eligibilityContext}</p>
                                                      </FormLabel>
                                                    </FormItem>
                                                  )
                                                }}
                                              />
                                            )) : (
                                                <p className="text-center text-sm text-muted-foreground p-4">No eligible players found.</p>
                                            )}
                                        </div>
                                    )}
                                </ScrollArea>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status for new players</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="active" disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Players to Team"}</Button>
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
  
  const isPlayer = form.watch('role') === 'Player';

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
  
  const [isBulkAddPlayerDialogOpen, setIsBulkAddPlayerDialogOpen] = React.useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const playerRoster = initialRoster.filter(m => PLAYER_ROLES.includes(m.role));
  const staffRoster = initialRoster.filter(m => STAFF_ROLES.includes(m.role));

  const [isGeneratingAnalysis, startAnalysisGeneration] = React.useTransition();
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(team.analysisReport || null);

  const handleGenerateAnalysis = () => {
    startAnalysisGeneration(async () => {
        try {
            const result = await generateOppositionAnalysisAction(team.teamId);
            setAnalysisResult(result);
            toast({ title: "Analysis Complete", description: "The team's strengths and weaknesses have been analyzed." });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate analysis.", variant: "destructive" });
        }
    });
  };

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
        <header>
          <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Teams
          </Link>
          <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border">
                        <AvatarImage src={team.logoUrl} alt={team.name} />
                        <AvatarFallback className="text-xl">{team.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
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
        </header>
        
        <Tabs defaultValue="roster">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="roster">Roster</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="roster" className="mt-4 space-y-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Player Roster</CardTitle><CardDescription>The main squad of players for the team.</CardDescription></div>
                    {canManage && <Button onClick={() => setIsBulkAddPlayerDialogOpen(true)}><PlusCircle className="mr-2" />Add Players</Button>}
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
                                {member.isViceCaptain && <TooltipProvider><Tooltip><TooltipTrigger><Badge variant="outline">VC</Badge></TooltipTrigger><TooltipContent><p>Vice-Captain</pTooltipContent></Tooltip></TooltipProvider>}
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
                                <TableRow><TableHead>Opponent</TableHead><TableHead>Date & Time</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow>
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
                                                <TableCell>{isClient ? format(match.dateTime, "PPP p") : ' '}</TableCell>
                                                <TableCell>{match.fieldName}</TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={
                                                      match.status === 'completed' ? 'secondary' :
                                                      match.status === 'live' ? 'default' :
                                                      ['postponed', 'cancelled', 'abandoned'].includes(match.status) ? 'outline' :
                                                      'default'
                                                    }
                                                    className={cn("capitalize", match.status === 'live' && "bg-green-600 text-white")}
                                                  >
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
             <TabsContent value="analysis" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>AI Team Analysis</CardTitle>
                                <CardDescription>Generate a summary of this team's strengths and weaknesses based on season stats.</CardDescription>
                            </div>
                            <Button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis}>
                                <BrainCircuit className={`mr-2 h-4 w-4 ${isGeneratingAnalysis ? 'animate-spin' : ''}`} />
                                {isGeneratingAnalysis ? 'Analyzing...' : (analysisResult ? 'Regenerate Analysis' : 'Generate Analysis')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isGeneratingAnalysis && (
                             <div className="flex flex-col items-center justify-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">The AI coach is analyzing the team's performance...</p>
                            </div>
                        )}
                        {!isGeneratingAnalysis && analysisResult && (
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{analysisResult}</div>
                        )}
                         {!isGeneratingAnalysis && !analysisResult && (
                            <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                                <p className="font-semibold">No analysis available.</p>
                                <p className="text-sm text-muted-foreground">Click the button to generate one.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
      
      {canManage && <BulkAddPlayerDialog 
        team={team}
        open={isBulkAddPlayerDialogOpen} 
        onOpenChange={setIsBulkAddPlayerDialogOpen} 
      />}
      {canManage && <AddStaffDialog 
        teamId={team.teamId}
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
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>
              This will remove <strong>{selectedMember?.personName}</strong> from the team. This action cannot be undone.
            </AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Removing..." : "Remove Member"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  )
}

    