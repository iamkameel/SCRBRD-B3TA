
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMatches } from "@/lib/actions/matches";
import { getLeaderboards, getTeamStandings } from "@/lib/actions/dashboard";
import { getTeams } from "@/lib/actions/teams";
import { getPlayers } from "@/lib/actions/players";
import { getFields } from "@/lib/actions/fields";
import { format } from "date-fns";
import { TeamStandingsChart, TopRunScorersChart, TopWicketTakersChart } from "../dashboard-charts";
import { DreamTeamCard } from "../dream-team-card";
import { AlertTriangle, ClipboardList, BarChart, Users, MapPin, Landmark, Handshake, Bus, Backpack, Scale, ArrowRight, UserCog, Database } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getTransactions } from "@/lib/actions/financials";
import { getSponsors } from "@/lib/actions/sponsors";
import { getVehicles } from "@/lib/actions/transport";
import { getEquipment } from "@/lib/actions/equipment";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getCompetitions } from '@/lib/actions/competitions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFixtureConflicts } from '@/lib/actions/alerts';


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
  <Link href={href} className="hover:bg-muted/50 block rounded-lg transition-colors">
    <StatCard {...props} />
  </Link>
);


export default async function AdminDashboard() {
  const [
    allMatches, 
    { topRunScorers, topWicketTakers }, 
    teamStandings, 
    allTeams, 
    allPlayers, 
    allFields,
    allTransactions,
    allSponsors,
    allVehicles,
    allEquipment,
    allCompetitions,
    conflicts,
  ] = await Promise.all([
    getMatches(),
    getLeaderboards(),
    getTeamStandings(),
    getTeams(),
    getPlayers(),
    getFields(),
    getTransactions(),
    getSponsors(),
    getVehicles(),
    getEquipment(),
    getCompetitions(),
    getFixtureConflicts(),
  ]);

  const today = new Date();
  const liveMatches = allMatches.filter(m => m.status === 'live');
  const upcomingToday = allMatches.filter(m => 
    m.status === 'scheduled' && 
    new Date(m.dateTime).toDateString() === today.toDateString()
  );
  const completedToday = allMatches.filter(m =>
    m.status === 'completed' &&
    new Date(m.dateTime).toDateString() === today.toDateString()
  );

  const fieldsInUse = new Set(liveMatches.map(m => m.fieldId));
  const fieldsInMaintenance = allFields.filter(f => f.status === 'Maintenance').length;
  const fieldsAvailable = allFields.length - fieldsInUse.size - fieldsInMaintenance;
  
  const income = allTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const expense = allTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const financialSummary = { income, expense, balance: income - expense };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your cricket league command center.</p>
      </header>
        
        {/* Critical Alerts Zone */}
        <div className="space-y-2">
            {conflicts.length > 0 && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 !text-red-600 dark:!text-red-400" />
                    <AlertTitle className="font-semibold">Fixture Conflicts</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                        <span>There are {conflicts.length} conflicts that need resolution.</span>
                        <Button asChild size="sm" variant="outline" className="border-red-500/50 hover:bg-red-500/20">
                            <Link href="/matches">Resolve Now</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
             <Alert className="border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
                <AlertTitle className="font-semibold">Umpire Reviews</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                    <span>There are 0 overdue umpire reviews.</span>
                    <Button size="sm" variant="outline" className="border-yellow-500/50 hover:bg-yellow-500/20">Review Queue</Button>
                </AlertDescription>
            </Alert>
        </div>

        {/* KPI Cards Zone */}
        <Card>
            <CardHeader><CardTitle>League Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
          
          <Card>
            <CardHeader><CardTitle>Today's Operations</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="live">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="live">Live Matches ({liveMatches.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming Today ({upcomingToday.length})</TabsTrigger>
                  <TabsTrigger value="results">Results ({completedToday.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="live" className="mt-4">
                  {liveMatches.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{liveMatches.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{match.fieldName}</TableCell><TableCell><Badge variant="destructive" className={cn("capitalize", match.status === 'live' && "bg-red-500 text-white animate-pulse")}>{match.status}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="text-center text-muted-foreground py-8">No matches are currently live.</p>}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                  {upcomingToday.length > 0 ? (
                     <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Time</TableHead><TableHead>Venue</TableHead></TableRow></TableHeader>
                        <TableBody>{upcomingToday.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{format(match.dateTime, 'p')}</TableCell><TableCell>{match.fieldName}</TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="text-center text-muted-foreground py-8">No more matches scheduled for today.</p>}
                </TabsContent>
                 <TabsContent value="results" className="mt-4">
                  {completedToday.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Result</TableHead><TableHead>Competition</TableHead></TableRow></TableHeader>
                        <TableBody>{completedToday.map(match => (<TableRow key={match.matchId}><TableCell className="font-medium"><Link href={`/matches/${match.matchId}`} className="hover:underline">{match.teamAName} vs {match.teamBName}</Link></TableCell><TableCell>{match.result}</TableCell><TableCell>{match.competitionName}</TableCell></TableRow>))}</TableBody>
                    </Table>
                  ) : <p className="text-center text-muted-foreground py-8">No matches completed today.</p>}
                </TabsContent>
              </Tabs>
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Field Status</h4>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500"/>Available: {fieldsAvailable}</span>
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500"/>In Use: {fieldsInUse.size}</span>
                    <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-yellow-500"/>Maintenance: {fieldsInMaintenance}</span>
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

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader><CardTitle>Top Performers</CardTitle><CardDescription>Season leaders in key categories.</CardDescription></CardHeader>
            <CardContent>
              <Tabs defaultValue="batting">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="batting">Batting</TabsTrigger><TabsTrigger value="bowling">Bowling</TabsTrigger></TabsList>
                <TabsContent value="batting" className="mt-4">
                  <TopRunScorersChart data={topRunScorers} />
                  {topRunScorers.map(player => (<div key={player.personId} className="flex items-center gap-2 mt-2"><div className="font-bold w-4 text-center text-xs"></div><div><Link className="font-semibold text-sm hover:underline" href={`/people/${player.personId}`}>{player.firstName} {player.lastName}</Link></div><div className="ml-auto font-bold text-sm">{player.stats.totalRuns}</div></div>))}
                </TabsContent>
                <TabsContent value="bowling" className="mt-4">
                  <TopWicketTakersChart data={topWicketTakers} />
                  {topWicketTakers.map(player => (<div key={player.personId} className="flex items-center gap-2 mt-2"><div className="font-bold w-4 text-center text-xs"></div><div><Link className="font-semibold text-sm hover:underline" href={`/people/${player.personId}`}>{player.firstName} {player.lastName}</Link></div><div className="ml-auto font-bold text-sm">{player.stats.wicketsTaken}</div></div>))}
                </TabsContent>
              </Tabs>
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/user-management" className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <UserCog className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">User Management</h3>
                            <p className="text-sm text-muted-foreground">Manage user roles and permissions.</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                </Link>
                <Link href="/data-management" className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <Database className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Data Management</h3>
                            <p className="text-sm text-muted-foreground">Migrate sample data or clear existing records.</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}
    





