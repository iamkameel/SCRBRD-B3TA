
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, UserCog, Database, BarChart2, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import type { Competition, Team, FixtureConflict, Person, StandingTeam, LeaderboardPlayer, Match, Vehicle, FullTransportAssignment, EquipmentItem, Transaction, Sponsor, Season, Division, School } from '@/lib/data';
import { DreamTeamCard } from '@/app/dream-team-card';

interface AdminDashboardData {
    kpis: {
        competitions: number;
        teams: number;
        players: number;
        fields: number;
        netBalance: number;
        sponsors: number;
    };
    operations: {
        liveMatches: Match[];
        todayMatches: Match[];
        availableFields: number;
        maintenanceFields: number;
    };
    resources: {
        fieldsInUse: number;
        transportAssignedToday: number;
        equipmentAssigned: number;
        totalEquipment: number;
        totalVehicles: number;
        totalFields: number;
    };
    teamStandings: StandingTeam[];
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

  const { kpis, operations, resources, teamStandings } = data;
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="flex flex-col gap-4">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm opacity-90">High-level overview of all operations.</p>
                </div>
            </div>
        </header>
        
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
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
                    <KpiCard title="Competitions" value={kpis.competitions} description="Active this season" href="/competitions" />
                    <KpiCard title="Teams" value={kpis.teams} description="All divisions" href="/teams" />
                    <KpiCard title="Players" value={kpis.players} description="Registered" href="/people" />
                    <KpiCard title="Fields & Venues" value={kpis.fields} description="Available for booking" href="/fields" />
                    <KpiCard title="Net Balance" value={formatCurrency(kpis.netBalance)} description="Current financial position" href="/financials" />
                    <KpiCard title="Sponsors" value={kpis.sponsors} description="Active partnerships" href="/sponsors" />
                </div>
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Operations Center</CardTitle><CardDescription>Live match operations and field status</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="font-semibold">Live Now ({operations.liveMatches.length})</p><p className="text-sm text-muted-foreground">{operations.liveMatches.length > 0 ? operations.liveMatches.map(m => m.teamAName).join(', ') : 'No matches'}</p></div>
                                    <div><p className="font-semibold">Today's Schedule ({operations.todayMatches.length})</p><p className="text-sm text-muted-foreground">{operations.todayMatches.length > 0 ? `${operations.todayMatches.length} matches` : 'No matches'}</p></div>
                                </div>
                                <div><p className="font-semibold">Field Status</p><p className="text-sm text-muted-foreground flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"></span>Available: {operations.availableFields} <span className="h-2 w-2 rounded-full bg-red-500"></span>In Use: {resources.fieldsInUse} <span className="h-2 w-2 rounded-full bg-yellow-500"></span>Maintenance: {operations.maintenanceFields}</p></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Team Standings</CardTitle><CardDescription>Top 3 teams in the current season.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                  <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>W</TableHead><TableHead>L</TableHead><TableHead>NRR</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {teamStandings.slice(0, 3).map(t => (
                                      <TableRow key={t.teamId}><TableCell>{t.name}</TableCell><TableCell>{t.stats.matchesWon}</TableCell><TableCell>{t.stats.matchesLost}</TableCell><TableCell>{t.stats.netRunRate.toFixed(2)}</TableCell></TableRow>
                                    ))}
                                    {teamStandings.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No standings available.</TableCell></TableRow>}
                                  </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Top Performers</CardTitle><CardDescription>Season leaders across all divisions and competitions</CardDescription></CardHeader>
                            <CardContent>
                                <div className="text-center py-4 text-muted-foreground"><p>Leaderboards are available on the Rankings page.</p></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Resource Utilization</CardTitle><CardDescription>Key resource allocation and usage metrics</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <ResourceItem label="Fields in Use" value={resources.fieldsInUse} total={resources.totalFields} />
                                <ResourceItem label="Transport Assigned Today" value={resources.transportAssignedToday} total={resources.totalVehicles} />
                                <ResourceItem label="Equipment Assigned" value={resources.equipmentAssigned} total={resources.totalEquipment} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <DreamTeamCard />
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
        <Progress value={total > 0 ? (value/total) * 100 : 0} />
    </div>
);

const AdminLink = ({href, icon: Icon, title}: {href: string, icon: React.ElementType, title: string}) => (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold">{title}</span>
        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
    </Link>
)
