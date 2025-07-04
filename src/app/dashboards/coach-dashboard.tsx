
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Users, BarChart2, ClipboardList, Target, Medal, ArrowRight, Bus, Backpack, ClipboardCheck, AlertCircle, PlusCircle } from 'lucide-react';
import type { Team, Match, TeamStats, LeaderboardPlayer, TrainingSession, School, Person } from '@/lib/data';
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


const requestSchema = z.object({
  schoolId: z.string({ required_error: "Please select a school." }),
  teamId: z.string({ required_error: "Please select a team." }),
});
type RequestFormValues = z.infer<typeof requestSchema>;

function RequestAssignmentForm({ schools, teams, person, role }: { schools: School[], teams: Team[], person: Person | null, role: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
    });
    
    const selectedSchoolId = form.watch('schoolId');
    const availableTeams = React.useMemo(() => {
        if (!selectedSchoolId) return teams;
        return teams.filter(t => t.schoolId === selectedSchoolId);
    }, [selectedSchoolId, teams]);
    
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Team Assignment</CardTitle>
                <CardDescription>You are not currently assigned to a team as a {role}. Select a school and team to request an assignment from the Sportsmaster.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
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

function ManagementLink({ href, title, description, icon: Icon }: { href: string; title:string; description: string; icon: React.ElementType; }) {
    return (
        <div className="p-4 transition-colors border rounded-lg hover:bg-muted/50 flex items-center gap-4">
            <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
            <Link href={href} className="flex-1 group">
                <h3 className="font-semibold group-hover:underline">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
             <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                <Link href={href} aria-label={`Navigate to ${title}`}>
                   <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
            </Button>
        </div>
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
}

function TeamManagerDashboardUI({ data }: { data: TeamManagerDashboardData }) {
    const { kpis, upcomingMatches, teams } = data;
    const managementLinks = [
        { href: `/teams/${teams[0]?.teamId}`, title: "Manage Roster", description: "View and update player assignments.", icon: Users },
        { href: "/matches", title: "View All Fixtures", description: "See the full schedule for all teams.", icon: ClipboardList },
        { href: "/equipment", title: "Equipment Hub", description: "Assign and track team equipment.", icon: Backpack },
        { href: "/transport", title: "Transport Hub", description: "Arrange transport for upcoming matches.", icon: Bus },
    ];
    
    return (
        <div className="flex flex-col gap-8">
            <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold">Team Manager Dashboard</h1>
                <p className="text-sm opacity-90">Your command center for team logistics and operations.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Managed Teams" value={kpis.managedTeams} icon={Users} />
                <StatCard title="Upcoming Fixtures" value={kpis.upcomingFixtures} icon={Calendar} />
                <StatCard title="Pending Availability" value={kpis.pendingAvailability} icon={ClipboardCheck} />
                <StatCard title="Transport Needed" value={kpis.transportNeeded} icon={AlertCircle} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Management Hub</CardTitle>
                    <CardDescription>Quick access to key logistical and management areas for your team(s).</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {managementLinks.map(link => <ManagementLink key={link.href} {...link} />)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Fixtures</CardTitle>
                    <CardDescription>Your next 5 scheduled matches.</CardDescription>
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
    team: Team | null;
    nextMatch: Match | null;
    recentMatches: Match[];
    teamStats: TeamStats | null;
    leaderboards: {
      topRunScorers: LeaderboardPlayer[];
      topWicketTakers: LeaderboardPlayer[];
    };
    upcomingSessions: TrainingSession[];
    allSchools?: School[];
    allTeams?: Team[];
  }
}

function CoachDashboardInternal({ data }: CoachDashboardProps) {
  const { person } = useAuth();
  const { team, nextMatch, recentMatches, teamStats, leaderboards, upcomingSessions } = data;
  const activeRole = person?.activeRole || 'User';

  if (!team || !teamStats) {
    return (
      <div className="flex flex-col gap-8">
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">{activeRole} Dashboard</h1>
            <p className="text-sm opacity-90">Welcome, {person?.firstName || 'User'}!</p>
        </header>
        <RequestAssignmentForm schools={data.allSchools || []} teams={data.allTeams || []} person={person} role={activeRole} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">{activeRole} Dashboard</h1>
        <p className="text-sm opacity-90">Welcome, {person?.firstName || 'User'}!</p>
        <p className="text-sm opacity-90 mt-1">{team.schoolName} &bull; {team.name}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Next Match */}
          <Card>
            <CardHeader>
              <CardTitle>Next Match</CardTitle>
              {nextMatch ? (
                <CardDescription>Prepare for your upcoming fixture against {nextMatch.teamAId === team.teamId ? nextMatch.teamBName : nextMatch.teamAName}.</CardDescription>
              ) : (
                <CardDescription>No upcoming matches scheduled.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {nextMatch ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">vs {nextMatch.teamAId === team.teamId ? nextMatch.teamBName : nextMatch.teamAName}</p>
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

          {/* Recent Form */}
          <Card>
            <CardHeader><CardTitle>Recent Form</CardTitle><CardDescription>A look at your last 3 completed matches.</CardDescription></CardHeader>
            <CardContent>
              {recentMatches.length > 0 ? (
                <Table>
                  <TableBody>
                    {recentMatches.map(match => (
                      <TableRow key={match.matchId}>
                        <TableCell>
                           <p className="font-medium">vs {match.teamAId === team.teamId ? match.teamBName : match.teamAName}</p>
                           <p className="text-xs text-muted-foreground">{format(match.dateTime, 'dd MMM yyyy')}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={match.winnerTeamId === team.teamId ? 'default' : 'destructive'} className={match.winnerTeamId ? '' : 'bg-yellow-500'}>
                            {match.winnerTeamId === team.teamId ? 'Win' : (match.winnerTeamId ? 'Loss' : 'Draw')}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{match.result}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No completed matches found.</p>
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
            {/* Team Stats */}
            <Card>
                <CardHeader><CardTitle>Season Snapshot</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <StatItem label="Played" value={teamStats.matchesPlayed} />
                    <StatItem label="Won" value={teamStats.matchesWon} />
                    <StatItem label="Lost" value={teamStats.matchesLost} />
                    <StatItem label="NRR" value={teamStats.netRunRate.toFixed(2)} />
                </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
                <CardHeader><CardTitle>Top Performers</CardTitle><CardDescription>Current season leaders on your team.</CardDescription></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Target className="text-primary"/>Top Run Scorers</h4>
                        {leaderboards.topRunScorers.length > 0 ? leaderboards.topRunScorers.slice(0, 3).map(p => (
                            <div key={p.personId} className="flex items-center gap-3 text-sm">
                                <Avatar className="h-8 w-8"><AvatarImage src={p.profileImageUrl} /><AvatarFallback>{p.firstName?.[0]}{p.lastName?.[0]}</AvatarFallback></Avatar>
                                <Link href={`/people/${p.personId}`} className="font-medium hover:underline flex-1 truncate">{p.firstName} {p.lastName}</Link>
                                <span className="font-bold">{p.stats.totalRuns}</span>
                            </div>
                        )) : <p className="text-xs text-muted-foreground text-center">No batting stats yet.</p>}
                    </div>
                    <div className="space-y-4 mt-6">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Medal className="text-primary"/>Top Wicket Takers</h4>
                        {leaderboards.topWicketTakers.length > 0 ? leaderboards.topWicketTakers.slice(0, 3).map(p => (
                            <div key={p.personId} className="flex items-center gap-3 text-sm">
                                <Avatar className="h-8 w-8"><AvatarImage src={p.profileImageUrl} /><AvatarFallback>{p.firstName?.[0]}{p.lastName?.[0]}</AvatarFallback></Avatar>
                                <Link href={`/people/${p.personId}`} className="font-medium hover:underline flex-1 truncate">{p.firstName} {p.lastName}</Link>
                                <span className="font-bold">{p.stats.wicketsTaken}</span>
                            </div>
                        )) : <p className="text-xs text-muted-foreground text-center">No bowling stats yet.</p>}
                    </div>
                </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card>
                <CardHeader><CardTitle>Logistics & Management</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline"><Link href={`/teams/${team.teamId}`}><Users />Roster</Link></Button>
                    <Button asChild variant="outline"><Link href="/matches"><ClipboardList />Fixtures</Link></Button>
                    <Button asChild variant="outline"><Link href="/equipment"><Backpack />Equipment</Link></Button>
                    <Button asChild variant="outline"><Link href="/transport"><Bus />Transport</Link></Button>
                </CardContent>
            </Card>
        </div>
      </div>
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
        // Default to coach data for Coach, Asst Coach, Captain
        return getCoachDashboardData(person.personId);
      };

      fetchData()
        .then(async (fetchedData: any) => {
            if (activeRole !== 'Team Manager' && !fetchedData.team) {
                const [allSchools, allTeams] = await Promise.all([getSchools(), getTeams()]);
                setData({ ...fetchedData, allSchools, allTeams });
            } else if (activeRole === 'Team Manager' && fetchedData.teams.length === 0) {
                 const [allSchools, allTeams] = await Promise.all([getSchools(), getTeams()]);
                 setData({ ...fetchedData, allSchools, allTeams });
            }
            else {
                setData(fetchedData);
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

  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (activeRole === 'Team Manager') {
    if (!data || data.teams.length === 0) {
      return (
         <div className="flex flex-col gap-8">
            <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold">{activeRole} Dashboard</h1>
                <p className="text-sm opacity-90">Welcome, {person?.firstName || 'User'}!</p>
            </header>
            <RequestAssignmentForm schools={data?.allSchools || []} teams={data?.allTeams || []} person={person} role={activeRole} />
        </div>
      );
    }
    return <TeamManagerDashboardUI data={data as TeamManagerDashboardData} />;
  }
  
  // Default to Coach view
  if (!data) {
    return <div/>;
  }
  
  return <CoachDashboardInternal data={data} />;
}
