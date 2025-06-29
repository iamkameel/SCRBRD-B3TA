
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamStandingsChart } from "../dashboard-charts";
import { AlertTriangle, Users, MapPin, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Competition, Team, FixtureConflict, Person, StandingTeam, LeaderboardPlayer } from '@/lib/data';
import { getSportsmasterDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}

interface SportsmasterDashboardData {
    allCompetitions: Competition[];
    allTeams: Team[];
    allPlayers: Person[];
    allFields: any[];
    conflicts: FixtureConflict[];
    unconfirmedAssignmentsCount: number;
    teamStandings: StandingTeam[];
    leaderboards: {
        topRunScorers: LeaderboardPlayer[];
        topWicketTakers: LeaderboardPlayer[];
    };
}

export default function SportsmasterDashboard() {
  const [data, setData] = React.useState<SportsmasterDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSportsmasterDashboardData().then(fetchedData => {
      setData(fetchedData);
      setLoading(false);
    }).catch(error => {
      console.error("Failed to load sportsmaster dashboard data:", error);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const {
    allCompetitions,
    allTeams,
    allPlayers,
    allFields,
    conflicts,
    unconfirmedAssignmentsCount,
    teamStandings,
    leaderboards
  } = data;
  
  const { topRunScorers, topWicketTakers } = leaderboards;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sportsmaster Dashboard</h1>
        <p className="text-muted-foreground">Strategic oversight for your assigned schools and districts.</p>
      </header>
        
        <div className="space-y-2">
             {unconfirmedAssignmentsCount > 0 && (
                <Alert variant="warning">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle className="font-semibold">Pending Confirmations</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{unconfirmedAssignmentsCount} official assignment(s) are awaiting confirmation.</span>
                        <Button asChild size="sm" variant="outline" className="border-accent/50 hover:bg-accent/20">
                            <Link href="/matches">View Matches</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {conflicts.length > 0 && (
                <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                        <Alert key={index} variant="destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertTitle className="font-semibold">{conflict.type} Conflict Detected</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                <span>{conflict.message}</span>
                                <Button asChild size="sm" variant="outline" className="border-red-500/50 hover:bg-red-500/20">
                                    <Link href="/matches">Resolve Now</Link>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}
        </div>

        <Card>
            <CardHeader><CardTitle>Global Overview</CardTitle><CardDescription>High-level metrics across all schools and divisions you oversee.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard title="Competitions" value={allCompetitions.length} icon={Shield} description="active this season" />
                <StatCard title="Teams" value={allTeams.length} icon={Users} description="across all divisions"/>
                <StatCard title="Players" value={allPlayers.filter(p => p.roles.includes('Player')).length} icon={Users} description="registered" />
                <StatCard title="Fields & Venues" value={allFields.length} icon={MapPin} description="available for booking" />
            </CardContent>
        </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        <div className="grid grid-cols-1 gap-8 lg:col-span-2">
            <Card>
                <CardHeader><CardTitle>Team Standings</CardTitle><CardDescription>Season leaderboard based on wins and Net Run Rate.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <TeamStandingsChart data={teamStandings} />
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]">Pos</TableHead><TableHead>Team</TableHead><TableHead className="text-right">W</TableHead><TableHead className="text-right">L</TableHead><TableHead className="text-right">NRR</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {teamStandings.slice(0, 5).map((team, index) => (
                        <TableRow key={team.teamId}><TableCell className="font-medium">{index + 1}</TableCell><TableCell><Link href={`/teams/${team.teamId}`} className="font-medium hover:underline">{team.name}</Link></TableCell><TableCell className="text-right">{team.stats.matchesWon}</TableCell><TableCell className="text-right">{team.stats.matchesLost}</TableCell><TableCell className="text-right">{team.stats.netRunRate.toFixed(2)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <Card>
            <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Season leaders across all divisions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="batting">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batting">Batting</TabsTrigger>
                  <TabsTrigger value="bowling">Bowling</TabsTrigger>
                </TabsList>
                <TabsContent value="batting" className="mt-4">
                  <Table>
                    <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">Runs</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topRunScorers.length > 0 ? topRunScorers.map((player) => (
                        <TableRow key={player.personId}>
                          <TableCell>
                            <Link href={`/people/${player.personId}`} className="font-medium hover:underline">{player.firstName} {player.lastName}</Link>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{player.stats.totalRuns}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={2} className="h-24 text-center">No batting data available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="bowling" className="mt-4">
                  <Table>
                    <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">Wickets</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topWicketTakers.length > 0 ? topWicketTakers.map((player) => (
                        <TableRow key={player.personId}>
                           <TableCell>
                            <Link href={`/people/${player.personId}`} className="font-medium hover:underline">{player.firstName} {player.lastName}</Link>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{player.stats.wicketsTaken}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={2} className="h-24 text-center">No bowling data available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
