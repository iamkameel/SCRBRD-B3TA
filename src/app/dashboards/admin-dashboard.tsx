
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowRight, UserCog, Database, Loader2, Trophy, Users, ClipboardList, MapPin, Scale, Handshake, ChevronDown, Bot, BarChart2, TrendingUp, Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import type { Competition, Team, FixtureConflict, Person, StandingTeam, LeaderboardPlayer, Match, Vehicle, FullTransportAssignment, EquipmentItem, Transaction, Sponsor, Season, Division, School } from '@/lib/data';

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
    allSeasons: Season[];
    allDivisions: Division[];
    allSchools: School[];
    conflicts: FixtureConflict[];
    unconfirmedAssignmentsCount: number;
}

function KpiCard({ title, value, description, href }: { title: string, value: string | number, description: string, href: string }) {
    return (
        <Link href={href}>
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                    <CardDescription>{title}</CardDescription>
                    <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold">{value}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>{description}</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function AdminDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [activeTab, setActiveTab] = React.useState('overview');
  
  // Filter states
  const [selectedSchool, setSelectedSchool] = React.useState('all');
  const [selectedSeason, setSelectedSeason] = React.useState('all');
  const [selectedCompetition, setSelectedCompetition] = React.useState('all');
  const [selectedDivision, setSelectedDivision] = React.useState('all');
  const [selectedDateRange, setSelectedDateRange] = React.useState('all');

  React.useEffect(() => {
    if (person?.personId) {
      getAdminDashboardData(person.personId).then(fetchedData => {
        setData(fetchedData);
        if (fetchedData.allSeasons.length > 0) {
            const activeSeason = fetchedData.allSeasons.find(s => s.active);
            setSelectedSeason(activeSeason?.seasonId || fetchedData.allSeasons[0].seasonId);
        }
        setLoading(false);
      }).catch(error => {
        console.error("Failed to load admin dashboard data:", error);
        setLoading(false);
      });
    }
  }, [person]);

  const filteredData = React.useMemo(() => {
    if (!data) return null;
    let { allTeams, allPlayers, allCompetitions, allMatches } = data;

    if (selectedSchool !== 'all') {
      allTeams = allTeams.filter(t => t.schoolId === selectedSchool);
      const teamIds = new Set(allTeams.map(t => t.teamId));
      allMatches = allMatches.filter(m => teamIds.has(m.teamAId) || teamIds.has(m.teamBId));
    }
    if (selectedSeason !== 'all') {
      allCompetitions = allCompetitions.filter(c => c.seasonId === selectedSeason);
      allTeams = allTeams.filter(t => t.seasonId === selectedSeason);
    }
    if (selectedCompetition !== 'all') {
      allMatches = allMatches.filter(m => m.competitionId === selectedCompetition);
    }
    if (selectedDivision !== 'all') {
      allTeams = allTeams.filter(t => t.divisionId === selectedDivision);
    }
    // Date range filtering would be more complex and is omitted for this example

    return { ...data, allTeams, allPlayers, allCompetitions, allMatches };
  }, [data, selectedSchool, selectedSeason, selectedCompetition, selectedDivision, selectedDateRange]);

  const headerContext = React.useMemo(() => {
      const schoolName = selectedSchool === 'all' ? 'All Schools' : data?.allSchools.find(s => s.schoolId === selectedSchool)?.name || '...';
      const seasonName = selectedSeason === 'all' ? 'All Seasons' : data?.allSeasons.find(s => s.seasonId === selectedSeason)?.name || '...';
      const competitionName = selectedCompetition === 'all' ? 'All Competitions' : data?.allCompetitions.find(c => c.competitionId === selectedCompetition)?.name || '...';
      return `${schoolName} · ${seasonName} · ${competitionName}`;
  }, [data, selectedSchool, selectedSeason, selectedCompetition]);


  if (loading || !filteredData) {
    return <DashboardSkeleton />;
  }

  const { allMatches, allTeams, allPlayers, allCompetitions, allFields, allSponsors, allTransactions } = filteredData;
  const liveMatches = allMatches.filter(m => m.status === 'live');
  const todayMatches = allMatches.filter(m => new Date(m.dateTime).toDateString() === new Date().toDateString());
  const financialSummary = allTransactions.reduce((acc, t) => {
    if (t.type === 'Income') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });
  const netBalance = financialSummary.income - financialSummary.expense;
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm opacity-90">{headerContext}</p>
                </div>
            </div>
        </header>

        {/* Filters */}
        <Card className="sticky top-[70px] z-30">
            <CardContent className="p-2 flex flex-wrap items-center gap-2">
                <Select value={selectedSchool} onValueChange={setSelectedSchool}><SelectTrigger className="w-full md:w-auto flex-grow"><SelectValue placeholder="School" /></SelectTrigger><SelectContent>{[{schoolId: 'all', name: 'All Schools'}, ...data.allSchools].map(s => <SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}><SelectTrigger className="w-full md:w-auto flex-grow"><SelectValue placeholder="Season" /></SelectTrigger><SelectContent>{[{seasonId: 'all', name: 'All Seasons'}, ...data.allSeasons].map(s => <SelectItem key={s.seasonId} value={s.seasonId}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedCompetition} onValueChange={setSelectedCompetition}><SelectTrigger className="w-full md:w-auto flex-grow"><SelectValue placeholder="Competition" /></SelectTrigger><SelectContent>{[{competitionId: 'all', name: 'All Competitions'}, ...filteredData.allCompetitions].map(c => <SelectItem key={c.competitionId} value={c.competitionId}>{c.name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}><SelectTrigger className="w-full md:w-auto flex-grow"><SelectValue placeholder="Division" /></SelectTrigger><SelectContent>{[{divisionId: 'all', name: 'All Divisions'}, ...data.allDivisions].map(d => <SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}><SelectTrigger className="w-full md:w-auto flex-grow"><SelectValue placeholder="Date Range" /></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem></SelectContent></Select>
                <div className="flex-grow flex justify-end items-center gap-2 w-full md:w-auto">
                     <Select disabled><SelectTrigger className="w-[120px]"><SelectValue placeholder="Quick Views" /></SelectTrigger></Select>
                     <Button variant="outline" onClick={() => { setSelectedSchool('all'); setSelectedSeason('all'); setSelectedCompetition('all'); setSelectedDivision('all'); setSelectedDateRange('all'); }}>Reset</Button>
                     <Button disabled>Save View</Button>
                </div>
            </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bySchool" disabled>By School</TabsTrigger>
                <TabsTrigger value="byCompetition" disabled>By Competition</TabsTrigger>
                <TabsTrigger value="byTeam" disabled>By Team</TabsTrigger>
                <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KpiCard title="Competitions" value={allCompetitions.length} description="Active this season" href="/competitions" />
                    <KpiCard title="Teams" value={allTeams.length} description="All divisions" href="/teams" />
                    <KpiCard title="Players" value={allPlayers.length} description="Registered" href="/people" />
                    <KpiCard title="Fields & Venues" value={allFields.length} description="Available for booking" href="/fields" />
                    <KpiCard title="Net Balance" value={formatCurrency(netBalance)} description="Current financial position" href="/financials" />
                    <KpiCard title="Sponsors" value={allSponsors.length} description="Active partnerships" href="/sponsors" />
                </div>
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Operations Center</CardTitle><CardDescription>Live match operations and field status</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="font-semibold">Live Now ({liveMatches.length})</p><p className="text-sm text-muted-foreground">{liveMatches.length > 0 ? liveMatches.map(m => m.teamAName).join(', ') : 'No matches'}</p></div>
                                    <div><p className="font-semibold">Today's Schedule ({todayMatches.length})</p><p className="text-sm text-muted-foreground">{todayMatches.length > 0 ? `${todayMatches.length} matches` : 'No matches'}</p></div>
                                </div>
                                <div><p className="font-semibold">Field Status</p><p className="text-sm text-muted-foreground flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"></span>Available: {allFields.filter(f => f.status === 'Available').length} <span className="h-2 w-2 rounded-full bg-red-500"></span>In Use: 0 <span className="h-2 w-2 rounded-full bg-yellow-500"></span>Maintenance: {allFields.filter(f => f.status === 'Maintenance').length}</p></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Team Standings</CardTitle><CardDescription>Season leaderboard based on Wins and Net Run Rate.</CardDescription></CardHeader>
                            <CardContent>
                                <div className="h-24 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-md"><BarChart2 className="w-6 h-6 mr-2" />Dynamic chart based on current filters</div>
                                <Table>
                                  <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>W</TableHead><TableHead>L</TableHead><TableHead>NRR</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {data.teamStandings.slice(0, 2).map(t => (
                                      <TableRow key={t.teamId}><TableCell>{t.name}</TableCell><TableCell>{t.stats.matchesWon}</TableCell><TableCell>{t.stats.matchesLost}</TableCell><TableCell>{t.stats.netRunRate.toFixed(2)}</TableCell></TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Top Performers</CardTitle><CardDescription>Season leaders across all divisions and competitions</CardDescription></CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-4"><Button size="sm" variant="secondary">Batting</Button><Button size="sm" variant="ghost">Bowling</Button></div>
                                <div className="text-center py-4 text-muted-foreground"><p>No batting data available</p><p className="text-xs">Adjust filters to see performance data</p></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Resource Utilization</CardTitle><CardDescription>Key resource allocation and usage metrics</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <ResourceItem label="Fields in Use" value={0} total={allFields.length} />
                                <ResourceItem label="Transport Assigned Today" value={0} total={data.allVehicles.length} />
                                <ResourceItem label="Equipment Assigned" value={data.allEquipment.filter(e => e.status === 'Assigned').length} total={data.allEquipment.length} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                           <CardHeader><CardTitle>AI Dream Team Selector</CardTitle><CardDescription>Let AI pick a top-performing squad from your players.</CardDescription></CardHeader>
                           <CardContent className="text-center"><Bot className="w-10 h-10 mx-auto text-muted-foreground mb-2" /><Button>Generate Dream Team</Button></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>System Administration</CardTitle><CardDescription>Quick access to system-level management tools.</CardDescription></CardHeader>
                            <CardContent className="space-y-2">
                                <AdminLink href="/user-management" icon={UserCog} title="User Management" />
                                <AdminLink href="/data-management" icon={Database} title="Data Management" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}

const ResourceItem = ({label, value, total}: {label: string, value: number, total: number}) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-muted-foreground">{label}</span>
            <span>{value} / {total}</span>
        </div>
        <Progress value={(value/total) * 100} />
    </div>
);

const AdminLink = ({href, icon: Icon, title}: {href: string, icon: React.ElementType, title: string}) => (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold">{title}</span>
        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
    </Link>
)

    