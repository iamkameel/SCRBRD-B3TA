
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { TeamStandingsChart } from "../dashboard-charts";
import { DreamTeamCard } from "../dream-team-card";
import { AlertTriangle, ClipboardList, Users, MapPin, Landmark, Handshake, Bus, Backpack, Scale, ArrowRight, UserCog, Database, AlertCircle, Download, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/lib/auth-context';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import type { Competition, Team, FixtureConflict, Person, StandingTeam, LeaderboardPlayer, Match, Vehicle, FullTransportAssignment, EquipmentItem, Transaction, Sponsor } from '@/lib/data';

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

const StatCardLink = ({ href, ...props }: React.ComponentProps<typeof StatCard> & { href: string }) => (
  <Link href={href} className="block transition-colors rounded-lg hover:bg-muted/50">
    <StatCard {...props} />
  </Link>
);

function ResourceStat({ icon: Icon, label, value, total, indicatorClassName }: { icon: React.ElementType, label: string, value: number, total: number, indicatorClassName?: string }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                </div>
                <span className="text-muted-foreground">{value} / {total}</span>
            </div>
            <Progress value={percentage} className="h-2 mt-2" indicatorClassName={indicatorClassName} />
        </div>
    );
}

interface AdminDashboardData {
    allMatches: Match[];
    topRunScorers: LeaderboardPlayer[];
    topWicketTakers: LeaderboardPlayer[];
    teamStandings: StandingTeam[];
    allTeams: Team[];
    allPlayers: Person[];
    allFields: any[];
    allTransactions: Transaction[];
    allSponsors: Sponsor[];
    allVehicles: Vehicle[];
    allEquipment: EquipmentItem[];
    allCompetitions: Competition[];
    conflicts: FixtureConflict[];
    allTransportAssignments: FullTransportAssignment[];
    unconfirmedAssignmentsCount: number;
}

export default function AdminDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getAdminDashboardData(person.personId).then(fetchedData => {
        setData(fetchedData);
        setLoading(false);
      }).catch(error => {
        console.error("Failed to load admin dashboard data:", error);
        setLoading(false);
      });
    }
  }, [person]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }
  
  const {
    allMatches, topRunScorers, topWicketTakers, teamStandings, allTeams, allPlayers, 
    allFields, allTransactions, allSponsors, allVehicles, allEquipment, allCompetitions,
    conflicts, allTransportAssignments, unconfirmedAssignmentsCount,
  } = data;


  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));

  const liveMatches = allMatches.filter(m => m.status === 'live');
  
  const todayMatches = allMatches.filter(m => isToday(m.dateTime))
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const thisWeekMatches = allMatches.filter(m => 
    isWithinInterval(m.dateTime, { start: todayStart, end: weekEnd })
  ).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  
  const fieldsInUse = new Set(liveMatches.map(m => m.fieldId));
  const fieldsInMaintenance = allFields.filter(f => f.status === 'Maintenance').length;
  const fieldsAvailable = allFields.length - fieldsInUse.size - fieldsInMaintenance;
  
  const income = allTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const expense = allTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const financialSummary = { income, expense, balance: income - expense };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const transportToday = allTransportAssignments.filter(a => {
      const assignmentDate = new Date(a.dateTime);
      return isToday(assignmentDate);
  });

  const equipmentByStatus = allEquipment.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your cricket league command center.</p>
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
            <CardHeader><CardTitle>League Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/competitions" title="Competitions" value={allCompetitions.length} icon={ClipboardList} description="active this season" />
                </TooltipTrigger><TooltipContent><p>View and manage all competitions.</p></TooltipContent></Tooltip></TooltipProvider>

                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/teams" title="Teams" value={allTeams.length} icon={Users} description="across all divisions"/>
                </TooltipTrigger><TooltipContent><p>View and manage all teams.</p></TooltipContent></Tooltip></TooltipProvider>

                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/people" title="Players" value={allPlayers.filter(p => p.roles.includes('Player')).length} icon={Users} description="registered" />
                </TooltipTrigger><TooltipContent><p>View and manage all players, coaches, and staff.</p></TooltipContent></Tooltip></TooltipProvider>

                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/fields" title="Fields & Venues" value={allFields.length} icon={MapPin} description="available for booking" />
                </TooltipTrigger><TooltipContent><p>View and manage all fields and venues.</p></TooltipContent></Tooltip></TooltipProvider>

                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/financials" title="Net Balance" value={formatCurrency(financialSummary.balance)} icon={Scale} description="income vs. expense" />
                </TooltipTrigger><TooltipContent><p>View and manage all financial transactions.</p></TooltipContent></Tooltip></TooltipProvider>
                
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/sponsors" title="Sponsors" value={allSponsors.length} icon={Handshake} description="partnered" />
                </TooltipTrigger><TooltipContent><p>View and manage all sponsors.</p></TooltipContent></Tooltip></TooltipProvider>

                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/transport" title="Vehicles" value={allVehicles.length} icon={Bus} description="in fleet" />
                </TooltipTrigger><TooltipContent><p>View and manage the transport fleet.</p></TooltipContent></Tooltip></TooltipProvider>
                
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <StatCardLink href="/equipment" title="Equipment" value={allEquipment.length} icon={Backpack} description="items in inventory" />
                </TooltipTrigger><TooltipContent><p>View and manage all equipment.</p></TooltipContent></Tooltip></TooltipProvider>
            </CardContent>
        </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        <div className="grid grid-cols-1 gap-8 lg:col-span-2">
          
          <Card>
            <CardHeader>
                <CardTitle>Operations Center</CardTitle>
                <CardDescription>An overview of live, daily, and weekly match operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="live">Live Now ({liveMatches.length})</TabsTrigger>
                  <TabsTrigger value="today">Today's Schedule ({todayMatches.length})</TabsTrigger>
                  <TabsTrigger value="this_week">This Week ({thisWeekMatches.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="live" className="mt-4">
                  {liveMatches.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{liveMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{match.fieldName}</TableCell><TableCell><Badge variant="destructive" className={cn("capitalize", match.status === 'live' && "text-white bg-red-500 animate-pulse")}>{match.status}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="py-8 text-center text-muted-foreground">No matches are currently live.</p>}
                </TabsContent>
                <TabsContent value="today" className="mt-4">
                  {todayMatches.length > 0 ? (
                     <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Time</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{todayMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{format(match.dateTime, 'p')}</TableCell><TableCell>{match.fieldName}</TableCell><TableCell><Badge variant={match.status === 'completed' ? 'secondary' : (match.status === 'live' ? 'destructive' : 'default')} className={cn("capitalize", match.status === 'live' && "text-white bg-red-500 animate-pulse")}>{match.status}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="py-8 text-center text-muted-foreground">No matches scheduled for today.</p>}
                </TabsContent>
                 <TabsContent value="this_week" className="mt-4">
                  {thisWeekMatches.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Date</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{thisWeekMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{format(match.dateTime, 'EEE, dd MMM p')}</TableCell><TableCell>{match.fieldName}</TableCell><TableCell><Badge variant={match.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{match.status}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="py-8 text-center text-muted-foreground">No other matches scheduled for this week.</p>}
                </TabsContent>
              </Tabs>
              <div className="pt-4 mt-6 border-t">
                <h4 className="mb-2 text-sm font-semibold">Field Status</h4>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/>Available: {fieldsAvailable}</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"/>In Use: {fieldsInUse.size}</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"/>Maintenance: {fieldsInMaintenance}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Season leaders across all divisions and categories.</CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <Select disabled>
                    <SelectTrigger className="w-auto md:w-[120px]">
                      <SelectValue placeholder="All Seasons" />
                    </SelectTrigger>
                  </Select>
                  <Button variant="outline" disabled>
                    <Download className="mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="batting">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batting">Batting</TabsTrigger>
                  <TabsTrigger value="bowling">Bowling</TabsTrigger>
                </TabsList>
                <TabsContent value="batting" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Avg</TableHead>
                        <TableHead className="text-right">SR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRunScorers.length > 0 ? topRunScorers.map((player, index) => (
                        <TableRow key={player.personId}>
                          <TableCell className="font-bold">#{index + 1}</TableCell>
                          <TableCell>
                            <Link href={`/people/${player.personId}`} className="flex items-center gap-2 font-medium hover:underline">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={player.profileImageUrl} alt={player.firstName} />
                                <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                              </Avatar>
                              <span>{player.firstName} {player.lastName}</span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{player.stats.totalRuns}</TableCell>
                          <TableCell className="text-right">{player.stats.battingAverage.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{player.stats.strikeRate.toFixed(2)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">No batting data available.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="bowling" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Wickets</TableHead>
                        <TableHead className="text-right">Avg</TableHead>
                        <TableHead className="text-right">Econ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topWicketTakers.length > 0 ? topWicketTakers.map((player, index) => (
                        <TableRow key={player.personId}>
                          <TableCell className="font-bold">#{index + 1}</TableCell>
                          <TableCell>
                            <Link href={`/people/${player.personId}`} className="flex items-center gap-2 font-medium hover:underline">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={player.profileImageUrl} alt={player.firstName} />
                                <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                              </Avatar>
                              <span>{player.firstName} {player.lastName}</span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{player.stats.wicketsTaken}</TableCell>
                          <TableCell className="text-right">{player.stats.bowlingAverage.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{player.stats.economyRate.toFixed(2)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">No bowling data available.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>A snapshot of key resource allocation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ResourceStat 
                    icon={MapPin} 
                    label="Fields In Use" 
                    value={fieldsInUse.size} 
                    total={allFields.length} 
                    indicatorClassName="bg-red-500" 
                />
                <ResourceStat 
                    icon={Bus} 
                    label="Transport Assigned Today" 
                    value={transportToday.length} 
                    total={allVehicles.length}
                    indicatorClassName="bg-blue-500" 
                />
                <ResourceStat 
                    icon={Backpack} 
                    label="Equipment Assigned" 
                    value={equipmentByStatus['Assigned'] || 0} 
                    total={allEquipment.length}
                    indicatorClassName="bg-yellow-500" 
                />
            </CardContent>
          </Card>
          <DreamTeamCard />
        </div>
      </div>
       <Card>
            <CardHeader>
                <CardTitle>System Administration</CardTitle>
                <CardDescription>Quick access to system-level management tools.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link href="/user-management" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <UserCog className="w-8 h-8 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">User Management</h3>
                            <p className="text-sm text-muted-foreground">Manage user roles and permissions.</p>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                </Link>
                <Link href="/data-management" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Data Management</h3>
                            <p className="text-sm text-muted-foreground">Migrate sample data or clear existing records.</p>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}
