
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { initialTeams as mockTeams, initialPlayers as mockPeople, mockTeamStats } from "@/lib/data";

// From schema: team_role_assignments
const assignmentSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  role: z.string({ required_error: "Please select a role." }),
  status: z.string({ required_error: "Please select a status." }),
  isCaptain: z.boolean().default(false),
  isViceCaptain: z.boolean().default(false),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface RosterMember {
  assignmentId: string;
  personId: string;
  personName: string;
  role: string;
  status: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

const ROLES = ["Player", "Coach", "Scorer", "Team Manager"];
const STATUSES = ["active", "on_trial", "injured", "retired"];

function AddPlayerToRosterDialog({ onPlayerAdded }: { onPlayerAdded: (assignment: RosterMember) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      isCaptain: false,
      isViceCaptain: false,
      status: "active",
      role: "Player"
    },
  });

  function onSubmit(data: AssignmentFormValues) {
    const person = mockPeople.find(p => p.personId === data.personId);
    if (!person) return;

    const newAssignment: RosterMember = {
      ...data,
      assignmentId: `assign_${Math.random().toString(36).substring(2, 9)}`,
      personName: `${person.firstName} ${person.lastName}`,
    };
    onPlayerAdded(newAssignment);
    toast({
      title: "Player Added to Roster",
      description: `${newAssignment.personName} has been assigned as ${newAssignment.role}.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add to Roster
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Person to Team</DialogTitle>
          <DialogDescription>Select a person and assign their role and status on this team.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {mockPeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
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
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="Player">
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue="active">
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-4 pt-2">
               <FormField
                control={form.control}
                name="isCaptain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>Captain</FormLabel></div>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="isViceCaptain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>Vice-Captain</FormLabel></div>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add to Roster</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const team = mockTeams.find(t => t.teamId === params.teamId);
  const [roster, setRoster] = React.useState<RosterMember[]>([]);

  const handlePlayerAdded = (assignment: RosterMember) => {
    setRoster(prev => [...prev, assignment]);
  };
  
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Team not found</h2>
        <p className="text-muted-foreground">The team you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/teams"><ArrowLeft className="mr-2" /> Back to Teams</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-8">
       <Link href="/teams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Link>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>
                    {team.divisionName} &bull; {team.schoolName} &bull; {team.seasonName}
                </CardDescription>
            </div>
            {team.teamColors && (
            <div className="flex items-center gap-2">
                {team.teamColors.primary && (
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                        className="h-8 w-8 rounded-full border"
                        style={{ backgroundColor: team.teamColors.primary }}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Primary: {team.teamColors.primary}</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                )}
                {team.teamColors.secondary && (
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                        className="h-8 w-8 rounded-full border"
                        style={{ backgroundColor: team.teamColors.secondary }}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Secondary: {team.teamColors.secondary}</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                )}
            </div>
            )}
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Player Roster</CardTitle>
            <CardDescription>Manage the players and staff assigned to this team.</CardDescription>
          </div>
          <AddPlayerToRosterDialog onPlayerAdded={handlePlayerAdded} />
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
              {roster.length > 0 ? (
                roster.map(member => (
                  <TableRow key={member.assignmentId}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {member.personName}
                      {member.isCaptain && <Badge variant="outline" className="ml-2">C</Badge>}
                      {member.isViceCaptain && <Badge variant="outline" className="ml-2">VC</Badge>}
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{member.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No players assigned to this roster yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
            <CardDescription>Overall performance for the current season.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                <StatItem label="Played" value={mockTeamStats.matchesPlayed} />
                <StatItem label="Won" value={mockTeamStats.matchesWon} />
                <StatItem label="Lost" value={mockTeamStats.matchesLost} />
                <StatItem label="Drawn" value={mockTeamStats.matchesDrawn} />
                <StatItem label="Runs Scored" value={mockTeamStats.totalRunsScored} />
                <StatItem label="Wickets Taken" value={mockTeamStats.totalWicketsTaken} />
                <StatItem label="Net Run Rate" value={mockTeamStats.netRunRate.toFixed(2)} />
            </div>
        </CardContent>
      </Card>
    </div>
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
