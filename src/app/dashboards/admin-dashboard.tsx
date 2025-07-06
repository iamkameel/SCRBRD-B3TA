
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Users, Shield, Trophy, MapPin, Database, Bus, Building, ClipboardList, UserCog, Banknote, ArrowRight, User, PlusCircle, HeartPulse, Wrench, Medal, Mail, ThumbsUp, ThumbsDown, Loader2, Handshake } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { format } from 'date-fns';
import { reviewAssignmentRequestAction } from '@/lib/actions/requests';
import type { AssignmentRequest } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { TeamDialog } from '@/app/teams/team-dialog';
import { CompetitionDialog } from '@/app/competitions/competition-dialog';
import { SchoolDialog } from '@/app/schools/school-dialog';
import { FieldDialog } from '@/app/fields/field-dialog';
import { TransactionDialog } from '@/app/financials/transaction-dialog';
import { SponsorDialog } from '@/app/sponsors/sponsor-dialog';
import { getTeams } from '@/lib/actions/teams';
import { getSchools } from '@/lib/actions/schools';
import { getDivisions } from '@/lib/actions/divisions';
import { getSeasons } from '@/lib/actions/seasons';
import { getCompetitions } from '@/lib/actions/competitions';
import { getFields } from '@/lib/actions/fields';
import { getPlayers, getPeopleByRole } from '@/lib/actions/players';
import type { Team, School, Division, Season, Person, Field, Competition } from '@/lib/data';
import { UserRoleDialog } from '@/app/user-management/user-role-dialog';

const PersonDialog = dynamic(() => import('@/app/people/person-dialog').then(mod => mod.PersonDialog), {
  ssr: false,
});


interface AdminDashboardData {
    kpis: {
        competitions: number;
        schools: number;
        teams: number;
        players: number;
        staff: number;
        medicalSupport: number;
        fieldsVenues: number;
        officials: number;
        groundStaff: number;
        fixtures: number;
        transport: number;
        awards: number;
    };
    pendingRequests: AssignmentRequest[];
}

interface DialogData {
    teams: Team[];
    schools: School[];
    divisions: Division[];
    seasons: Season[];
    competitions: Competition[];
    fields: Field[];
    groundskeeper: Person[];
    allPeople: Person[];
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

function ManagementLink({ href, title, description, icon: Icon, onAddClick }: { href: string; title:string; description: string; icon: React.ElementType; onAddClick?: () => void; }) {
    return (
        <div className="p-4 transition-colors border rounded-lg hover:bg-muted/50 flex items-center gap-4">
            <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
            <Link href={href} className="flex-1 group">
                <h3 className="font-semibold group-hover:underline">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
            <div className="flex items-center shrink-0">
                {onAddClick ? (
                    <Button onClick={onAddClick} variant="outline" size="icon" className="h-9 w-9">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add new for {title}</span>
                    </Button>
                ) : (
                     <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href={href} aria-label={`Navigate to ${title}`}>
                           <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
  const { person } = useAuth();
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [dialogData, setDialogData] = React.useState<DialogData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const [isReviewing, startReviewTransition] = React.useTransition();
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);

  const [dialogState, setDialogState] = React.useState({
      school: false,
      competition: false,
      team: false,
      field: false,
      financial: false,
      sponsor: false,
      person: false,
      userRole: false,
  });

  const handleReview = (requestId: string, decision: 'approve' | 'deny') => {
    startReviewTransition(async () => {
        setReviewingId(requestId);
        try {
            await reviewAssignmentRequestAction({ requestId, decision });
            toast({ title: 'Request Reviewed', description: `The request has been ${decision}d.`});
            // The useEffect will refetch data because its dependency `isReviewing` changes.
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : "Could not review request.", variant: "destructive"});
        } finally {
            setReviewingId(null);
        }
    });
  }

  React.useEffect(() => {
    async function loadData() {
        try {
            const dashboardDataPromise = getAdminDashboardData();
            
            // Fetch data needed for dialogs
            const teamsPromise = getTeams();
            const schoolsPromise = getSchools();
            const divisionsPromise = getDivisions();
            const seasonsPromise = getSeasons();
            const competitionsPromise = getCompetitions();
            const fieldsPromise = getFields();
            const groundskeeperPromise = getPeopleByRole('Grounds-Keeper');
            const allPeoplePromise = getPlayers();

            const [dashboard, teams, schools, divisions, seasons, competitions, fields, groundskeeper, allPeople] = await Promise.all([
                dashboardDataPromise, teamsPromise, schoolsPromise, divisionsPromise, seasonsPromise, competitionsPromise, fieldsPromise, groundskeeperPromise, allPeoplePromise
            ]);

            setData(dashboard as AdminDashboardData);
            setDialogData({ teams, schools, divisions, seasons, competitions, fields, groundskeeper, allPeople });

        } catch (error) {
            console.error("Failed to load admin dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [isReviewing]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { kpis, pendingRequests } = data;

  const managementLinks = [
    { href: "/people", title: "Player Management", description: "Manage all player profiles, stats, and roles.", icon: User, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/people", title: "Staff Management", description: "Manage coaches, medical staff, and grounds-keepers.", icon: UserCog, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/people", title: "Official Management", description: "Manage umpires, scorers, and other match officials.", icon: Users, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/teams", title: "Team Management", description: "Create teams and manage rosters.", icon: Users, onAddClick: () => setDialogState(s => ({...s, team: true})) },
    { href: "/competitions", title: "Competition Management", description: "Set up leagues, cups, and tournaments.", icon: Trophy, onAddClick: () => setDialogState(s => ({...s, competition: true})) },
    { href: "/matches", title: "Fixture Management", description: "Schedule and update all matches.", icon: ClipboardList },
    { href: "/schools", title: "School & Division Management", description: "Manage schools, divisions, and seasons.", icon: Building, onAddClick: () => setDialogState(s => ({...s, school: true})) },
    { href: "/fields", title: "Field & Venue Management", description: "Manage all available grounds.", icon: MapPin, onAddClick: () => setDialogState(s => ({...s, field: true})) },
    { href: "/transport", title: "Transport Hub", description: "Manage vehicles and driver assignments.", icon: Bus },
    { href: "/financials", title: "Financials", description: "Track income and expenses.", icon: Banknote, onAddClick: () => setDialogState(s => ({...s, financial: true})) },
    { href: "/sponsors", title: "Sponsors", description: "Manage league and team sponsors.", icon: Handshake, onAddClick: () => setDialogState(s => ({...s, sponsor: true})) },
    { href: "/user-management", title: "User Management", description: "Invite new users or manage existing user roles.", icon: UserCog, onAddClick: () => setDialogState(s => ({ ...s, userRole: true })) },
    { href: "/data-management", title: "Data Management", description: "Migrate sample data or clear records.", icon: Database },
  ];

  return (
    <>
    <div className="flex flex-col gap-8">
        <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm opacity-90">High-level overview of all operations.</p>
                </div>
            </div>
        </header>

        {pendingRequests && pendingRequests.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail />Assignment Requests</CardTitle>
                    <CardDescription>Review pending requests from coaches and other staff.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.map(req => (
                                <TableRow key={req.requestId}>
                                    <TableCell>
                                        <p className="font-semibold">{req.requesterName}</p>
                                        <p className="text-sm text-muted-foreground">requests to be a {req.role} for {req.targetName}</p>
                                    </TableCell>
                                    <TableCell>{format(req.createdAt, 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-100" onClick={() => handleReview(req.requestId, 'approve')} disabled={isReviewing}>
                                            {isReviewing && reviewingId === req.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                        </Button>
                                         <Button size="icon" variant="outline" className="text-red-600 hover:bg-red-100" onClick={() => handleReview(req.requestId, 'deny')} disabled={isReviewing}>
                                            {isReviewing && reviewingId === req.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Global Overview</CardTitle>
                <CardDescription>High-level metrics across the entire system.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                <StatCard title="Competitions" value={kpis.competitions} icon={Trophy} />
                <StatCard title="Schools" value={kpis.schools} icon={Building} />
                <StatCard title="Teams" value={kpis.teams} icon={Users} />
                <StatCard title="Players" value={kpis.players} icon={User} />
                <StatCard title="Staff" value={kpis.staff} icon={UserCog} />
                <StatCard title="Medical & Support" value={kpis.medicalSupport} icon={HeartPulse} />
                <StatCard title="Fields & Venues" value={kpis.fieldsVenues} icon={MapPin} />
                <StatCard title="Officials" value={kpis.officials} icon={Users} />
                <StatCard title="Ground Staff" value={kpis.groundStaff} icon={Wrench} />
                <StatCard title="Fixtures" value={kpis.fixtures} icon={ClipboardList} />
                <StatCard title="Transport" value={kpis.transport} icon={Bus} />
                <StatCard title="Awards" value={kpis.awards} icon={Medal} />
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Management Hub</CardTitle>
                <CardDescription>Quick access to key management areas where you can add and assign resources.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
               {managementLinks.map(link => (
                   <ManagementLink key={link.title} {...link} />
               ))}
            </CardContent>
        </Card>
    </div>

    {dialogData && (
        <>
            <SchoolDialog mode="add" open={dialogState.school} onOpenChange={(open) => setDialogState(s => ({...s, school: open}))} />
            <TeamDialog mode="add" open={dialogState.team} onOpenChange={(open) => setDialogState(s => ({...s, team: open}))} schools={dialogData.schools} divisions={dialogData.divisions} seasons={dialogData.seasons} />
            <CompetitionDialog mode="add" open={dialogState.competition} onOpenChange={(open) => setDialogState(s => ({...s, competition: open}))} seasons={dialogData.seasons} divisions={dialogData.divisions} teams={dialogData.teams} />
            <FieldDialog mode="add" open={dialogState.field} onOpenChange={(open) => setDialogState(s => ({...s, field: open}))} schools={dialogData.schools} groundskeepers={dialogData.groundskeeper} />
            <TransactionDialog mode="add" open={dialogState.financial} onOpenChange={(open) => setDialogState(s => ({...s, financial: open}))} />
            <SponsorDialog mode="add" open={dialogState.sponsor} onOpenChange={(open) => setDialogState(s => ({...s, sponsor: open}))} />
            {dialogState.person && (
                <PersonDialog
                    mode="add"
                    person={undefined}
                    currentUser={person}
                    open={dialogState.person}
                    onOpenChange={(open) => setDialogState(s => ({ ...s, person: open }))}
                    schools={dialogData.schools}
                />
            )}
            {dialogState.userRole && (
                <UserRoleDialog
                    users={dialogData.allPeople}
                    currentUser={person}
                    open={dialogState.userRole}
                    onOpenChange={(open) => setDialogState(s => ({ ...s, userRole: open }))}
                />
            )}
        </>
    )}
    </>
  );
}
