
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Users, BarChart2, ClipboardList, Target, Medal, ArrowRight, Bus, Backpack, ClipboardCheck, AlertCircle, PlusCircle } from 'lucide-react';
import type { Team, Match, TeamStats, LeaderboardPlayer, TrainingSession, School, Person, AssignmentRequest } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getCoachDashboardData, getTeamManagerDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { createAssignmentRequestAction } from '@/lib/actions/requests';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { StatItem } from '@/components/stat-item';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


const requestSchema = z.object({
  schoolId: z.string({ required_error: "Please select a school." }),
  teamId: z.string({ required_error: "Please select a team." }),
});
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestAssignmentForm({ schools, allTeams, person, role, isDialog }: { schools: School[], allTeams: Team[], person: Person | null, role: string, isDialog?: boolean }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
    });
    
    const selectedSchoolId = form.watch('schoolId');
    const availableTeams = React.useMemo(() => {
        if (!selectedSchoolId) return allTeams;
        return allTeams.filter(t => t.schoolId === selectedSchoolId);
    }, [selectedSchoolId, allTeams]);
    
    React.useEffect(() => {
        form.resetField('teamId');
    }, [selectedSchoolId, form]);

    function onSubmit(data: RequestFormValues) {
        startTransition(async () => {
            if (!person?.personId) {
                toast({ title: "Error", description: "Could not identify current user. Please log in again.", variant: "destructive" });
                return;
            }
            try {
                await createAssignmentRequestAction({ 
                    targetId: data.teamId, 
                    targetType: 'Team', 
                    role: role,
                    requesterId: person.personId,
                });
                toast({ title: "Request Sent", description: "Your assignment request has been sent to the Sportsmaster for approval."});
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not send request.", variant: "destructive" });
            }
        });
    }

    const formContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="schoolId" render={({ field }) => (
                    <FormItem><FormLabel>School</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger></FormControl>
                        <SelectContent>{schools.map(s => <SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="teamId" render={({ field }) => (
                    <FormItem><FormLabel>Team</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!availableTeams.length}>
                        <FormControl><SelectTrigger><SelectValue placeholder={!selectedSchoolId ? 'Select a school first' : 'Select a team'} /></SelectTrigger></FormControl>
                        <SelectContent>{availableTeams.map(t => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage />
                    </FormItem>
                )}/>
                <Button type="submit" disabled={isPending}>{isPending ? 'Sending...' : 'Send Request'}</Button>
            </form>
        </Form>
    );

    if (isDialog) {
        return formContent;
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Request Team Assignment</CardTitle>
                <CardDescription>You are not currently assigned to a team as a {role}. Select a school and team to request an assignment from the Sportsmaster.</CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    )
}

function RequestAssignmentDialog({ schools, allTeams, person, role, open, onOpenChange }: { schools: School[], allTeams: Team[], person: Person | null, role: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Request New Team Assignment</DialogTitle>
                    <DialogDescription>Select a school and team to request an assignment.</DialogDescription>
                </DialogHeader>
                <RequestAssignmentForm schools={schools} allTeams={allTeams} person={person} role={role} isDialog />
            </DialogContent>
        </Dialog>
    );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}


interface TeamManagerDashboardData {
    kpis: {
        managedTeams: number;
        upcomingFixtures: number;
        pendingAvailability: number;
        transportNeeded: number;
    };
    upcomingMatches: Match[];
    teams: Team[];
    pendingRequests: AssignmentRequest[];
    allSchools?: School[];
    allTeams?: Team[];
}

function TeamManagerDashboardUI({ data }: { data: TeamManagerDashboardData }) {
    const { kpis, upcomingMatches, teams, pendingRequests } = data;
    
    return (
        <div className="flex flex-col gap-8">
            <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold">Team Manager Dashboard</h1>
                <p className="text-sm opacity-90">Your command center for team logistics and operations.</p>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Assigned Teams</CardTitle>
                    <CardDescription>An overview of all teams you currently manage.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Team Name</TableHead><TableHead>Division</TableHead><TableHead>Season</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {teams.map(team => (
                                <TableRow key={team.teamId}>
                                    <TableCell className="font-medium"><Link href={`/teams/${team.teamId}`} className="hover:underline">{team.name}</Link></TableCell>
                                    <TableCell>{team.divisionName}</TableCell>
                                    <TableCell>{team.seasonName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Managed Teams" value={kpis.managedTeams} icon={Users} />
                <StatCard title="Upcoming Fixtures" value={kpis.upcomingFixtures} icon={Calendar} />
                <StatCard title="Pending Availability" value={kpis.pendingAvailability} icon={ClipboardCheck} />
                <StatCard title="Transport Needed" value={kpis.transportNeeded} icon={AlertCircle} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Fixtures</CardTitle>
                    <CardDescription>Your next 5 scheduled matches across all your teams.</CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingMatches.length > 0 ? (
                        <Table>
                            <TableBody>
                                {upcomingMatches.map(match => (
                                    <TableRow key={match.matchId}>
                                        <TableCell>
                                            <p className="font-medium">{match.teamAName} vs {match.teamBName}</p>
                                            <p className="text-xs text-muted-foreground">{format(match.dateTime, 'EEE, dd MMM p')} at {match.fieldName}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/matches/${match.matchId}`}>View Match</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No upcoming matches for your teams.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


interface CoachDashboardProps {
  data: {
    teams: Team[];
    team: Team | null; // The primary team for detailed cards
    nextMatch: Match | null;
    recentMatches: Match[];
    teamStats: TeamStats | null;
    leaderboards: {
      topRunScorers: LeaderboardPlayer[];
      topWicketTakers: LeaderboardPlayer[];
    };
    upcomingSessions: TrainingSession[];
    pendingRequests: AssignmentRequest[];
    allSchools?: School[];
    allTeams?: Team[];
  }
}

function CoachDashboardInternal({ data }: CoachDashboardProps) {
  const { person } = useAuth();
  const { teams, team, nextMatch, recentMatches, teamStats, leaderboards, upcomingSessions } = data;
  const activeRole = person?.activeRole || 'User';
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">{activeRole} Dashboard</h1>
        <p className="text-sm opacity-90">Welcome, {person?.firstName || 'User'}!</p>
      </header>
      
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>An overview of all teams you are currently assigned to.</CardDescription>
            </div>
            <Button onClick={() => setIsRequestDialogOpen(true)} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />Request New Assignment
            </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>School</TableHead><TableHead>Division</TableHead></TableRow></TableHeader>
                <TableBody>
                {teams.map(t => (
                    <TableRow key={t.teamId}>
                        <TableCell className="font-medium"><Link href={`/teams/${t.teamId}`} className="hover:underline">{t.name}</Link></TableCell>
                        <TableCell>{t.schoolName}</TableCell>
                        <TableCell>{t.divisionName}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Next Match</CardTitle>
              {nextMatch ? (
                <CardDescription>Your next upcoming fixture is for {team?.name}.</CardDescription>
              ) : (
                <CardDescription>No upcoming matches scheduled for your primary team.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {nextMatch ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">vs {nextMatch.teamAId === team?.teamId ? nextMatch.teamBName : nextMatch.teamAName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(nextMatch.dateTime, 'PPP, p')} at {nextMatch.fieldName}
                    </p>
                  </div>
                  <Button asChild><Link href={`/matches/${nextMatch.matchId}`}>View Match & Set Lineup</Link></Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No upcoming matches.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader><CardTitle>Upcoming Sessions</CardTitle></CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <ul className="space-y-3">
                    {upcomingSessions.map(session => (
                      <li key={session.sessionId}>
                        <p className="font-semibold">{session.title}</p>
                        <p className="text-sm text-muted-foreground">{format(session.date, 'PPP, p')}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">No sessions planned.</p>
                )}
                <Button asChild variant="outline" className="w-full mt-4"><Link href="/planner">Go to Planner</Link></Button>
              </CardContent>
            </Card>
        </div>
      </div>
      
       <RequestAssignmentDialog
            schools={data.allSchools || []}
            allTeams={data.allTeams || []}
            person={person}
            role={activeRole}
            open={isRequestDialogOpen}
            onOpenChange={setIsRequestDialogOpen}
        />
    </div>
  );
}

export default function CoachDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const activeRole = person?.activeRole;

  React.useEffect(() => {
    if (person?.personId) {
      setLoading(true);
      
      const fetchData = async () => {
        if (activeRole === 'Team Manager') {
            return getTeamManagerDashboardData(person.personId);
        }
        return getCoachDashboardData(person.personId);
      };

      fetchData()
        .then(async (fetchedData: any) => {
            const teamsExist = fetchedData.teams && fetchedData.teams.length > 0;
            if (!teamsExist) {
                const [allSchools, allTeams] = await Promise.all([getSchools(), getTeams()]);
                setData({ ...fetchedData, allSchools, allTeams });
            } else {
                 setData({ ...fetchedData, allSchools: [], allTeams: []}); // Avoid fetching if not needed
            }
        })
        .catch(error => {
            console.error("Failed to load dashboard data:", error);
            setData(null);
        })
        .finally(() => {
            setLoading(false);
        });
    } else if (person === null) {
        setLoading(false);
    }
  }, [person, activeRole]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }
  
  if (activeRole === 'Team Manager') {
    return <TeamManagerDashboardUI data={data as TeamManagerDashboardData} />;
  }
  
  const noTeamsAssigned = !data.teams || data.teams.length === 0;

  if (noTeamsAssigned) {
    return (
      <div className="flex flex-col gap-8">
         <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">{activeRole} Dashboard</h1>
            <p className="text-sm opacity-90">Welcome, {person?.firstName || 'User'}!</p>
        </header>
        <RequestAssignmentForm schools={data.allSchools} allTeams={data.allTeams} person={person} role={activeRole || ''} />
         {data.pendingRequests && data.pendingRequests.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Your Pending Requests</CardTitle>
                    <CardDescription>Status of your recent assignment requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {data.pendingRequests.map((req: AssignmentRequest) => (
                                <TableRow key={req.requestId}>
                                    <TableCell>
                                        <p className="font-semibold">Request to be {req.role}</p>
                                        <p className="text-sm text-muted-foreground">for {req.targetName}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline">{req.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </div>
    );
  }
  
  return <CoachDashboardInternal data={data} />;
}
