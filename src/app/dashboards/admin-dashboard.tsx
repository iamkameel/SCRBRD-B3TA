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
import type { AssignmentRequest, Match } from '@/lib/data';
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
import { cn } from '@/lib/utils';
import { FixtureCentreCard } from '@/components/fixture-centre-card';


const PersonDialog = dynamic(() => import('@/app/people/person-dialog').then(mod => mod.PersonDialog), {
  ssr: false,
});

const GradientBase = ({ children }: { children: React.ReactNode }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#icon-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <defs>
            <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: '#21c45e'}} />
                <stop offset="100%" style={{stopColor: '#94dca4'}} />
            </linearGradient>
        </defs>
        {children}
    </svg>
);

const GradientUserIcon = () => ( <GradientBase><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></GradientBase> );
const GradientUserCogIcon = () => ( <GradientBase><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><circle cx="19" cy="11" r="2" /><path d="M19 8v1" /><path d="M19 13v1" /><path d="m21.6 9.5-.87.5" /><path d="m17.27 12-.87.5" /><path d="m21.6 12.5-.87-.5" /><path d="m17.27 10-.87-.5" /></GradientBase> );
const GradientUsersIcon = () => ( <GradientBase><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></GradientBase> );
const GradientTrophy = () => ( <GradientBase><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></GradientBase> );
const GradientClipboardList = () => ( <GradientBase><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></GradientBase> );
const GradientBuilding = () => ( <GradientBase><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></GradientBase> );
const GradientMapPin = () => ( <GradientBase><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></GradientBase> );
const GradientBus = () => ( <GradientBase><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H6c-1.1 0-2.1.8-2.3 1.9l-1.4 5c-.1.4-.2.8-.2-1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8H6"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></GradientBase> );
const GradientBanknote = () => ( <GradientBase><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></GradientBase> );
const GradientHandshake = () => ( <GradientBase><path d="M11 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 1-2.5 2.5z"/><path d="M12.5 16.5a2.5 2.5 0 0 0 2.5 2.5h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2"/><path d="m3 16 3-3"/><path d="m21 8-3 3"/></GradientBase> );
const GradientDatabase = () => ( <GradientBase><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></GradientBase> );

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
    liveMatches: Match[];
    upcomingFixtures: Match[];
    recentResults: Match[];
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

function StatCard({ title, value, icon: Icon, description, href }: { title: string; value: string | number; icon: React.ElementType; description?: string, href: string }) {
    return (
        <Link href={href} className="block group">
            <Card className="h-full transition-colors group-hover:bg-[#94dca4]/20 dark:group-hover:bg-[#94dca4]/10 group-hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </CardContent>
            </Card>
        </Link>
    );
}

function ManagementLink({ href, title, description, icon: Icon, onAddClick }: { href: string; title:string; description: string; icon: React.ElementType; onAddClick?: () => void; }) {
    return (
        <div className="p-4 transition-colors border rounded-lg flex items-center gap-4 hover:bg-[#94dca4]/20 dark:hover:bg-[#94dca4]/10">
            <Icon />
            <Link href={href} className="flex-1 group">
                <h3 className="font-semibold group-hover:underline">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
            <div className="flex items-center shrink-0">
                {onAddClick ? (
                    <Button onClick={onAddClick} size="icon" className="h-9 w-9 bg-[#26a66c] text-white hover:bg-[#8bcaac]">
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

  const { kpis, pendingRequests, liveMatches, upcomingFixtures, recentResults } = data;

  const managementLinks = [
    { href: "/people", title: "Player Management", description: "Manage all player profiles, stats, and roles.", icon: GradientUserIcon, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/people", title: "Staff Management", description: "Manage coaches, medical staff, and grounds-keepers.", icon: GradientUserCogIcon, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/people", title: "Official Management", description: "Manage umpires, scorers, and other match officials.", icon: GradientUsersIcon, onAddClick: () => setDialogState(s => ({ ...s, person: true })) },
    { href: "/teams", title: "Team Management", description: "Create teams and manage rosters.", icon: GradientUsersIcon, onAddClick: () => setDialogState(s => ({...s, team: true})) },
    { href: "/competitions", title: "Competition Management", description: "Set up leagues, cups, and tournaments.", icon: GradientTrophy, onAddClick: () => setDialogState(s => ({...s, competition: true})) },
    { href: "/matches", title: "Fixture Management", description: "Schedule and update all matches.", icon: GradientClipboardList },
    { href: "/schools", title: "School & Division Management", description: "Manage schools, divisions, and seasons.", icon: GradientBuilding, onAddClick: () => setDialogState(s => ({...s, school: true})) },
    { href: "/fields", title: "Field & Venue Management", description: "Manage all available grounds.", icon: GradientMapPin, onAddClick: () => setDialogState(s => ({...s, field: true})) },
    { href: "/transport", title: "Transport Hub", description: "Manage vehicles and driver assignments.", icon: GradientBus },
    { href: "/financials", title: "Financials", description: "Track income and expenses.", icon: GradientBanknote, onAddClick: () => setDialogState(s => ({...s, financial: true})) },
    { href: "/sponsors", title: "Sponsors", description: "Manage league and team sponsors.", icon: GradientHandshake, onAddClick: () => setDialogState(s => ({...s, sponsor: true})) },
    { href: "/user-management", title: "User Management", description: "Invite new users or manage existing user roles.", icon: GradientUserCogIcon, onAddClick: () => setDialogState(s => ({ ...s, userRole: true })) },
    { href: "/data-management", title: "Data Management", description: "Migrate sample data or clear records.", icon: GradientDatabase },
  ];

  return (
    <>
    <div className="flex flex-col gap-8">
        <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
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

         <div className="space-y-8">
            <FixtureCentreCard
                liveMatches={liveMatches}
                upcomingFixtures={upcomingFixtures}
                recentResults={recentResults}
            />
             <Card>
                <CardHeader>
                    <CardTitle>Global Overview</CardTitle>
                    <CardDescription>High-level metrics across the entire system. Click a card to navigate.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    <StatCard title="Competitions" value={kpis.competitions} icon={Trophy} href="/competitions" description="active this season" />
                    <StatCard title="Schools" value={kpis.schools} icon={Building} href="/schools" description="registered in system" />
                    <StatCard title="Teams" value={kpis.teams} icon={Users} href="/teams" description="across all divisions"/>
                    <StatCard title="Players" value={kpis.players} icon={User} href="/people" description="active players" />
                    <StatCard title="Staff" value={kpis.staff} icon={UserCog} href="/people" description="coaches & officials" />
                    <StatCard title="Medical & Support" value={kpis.medicalSupport} icon={HeartPulse} href="/people" description="all support staff" />
                    <StatCard title="Fields & Venues" value={kpis.fieldsVenues} icon={MapPin} href="/fields" description="available for booking" />
                    <StatCard title="Officials" value={kpis.officials} icon={Users} href="/people" description="umpires & scorers" />
                    <StatCard title="Ground Staff" value={kpis.groundStaff} icon={Wrench} href="/people" description="assigned groundskeepers" />
                    <StatCard title="Fixtures" value={kpis.fixtures} icon={ClipboardList} href="/matches" description="total matches" />
                    <StatCard title="Transport" value={kpis.transport} icon={Bus} href="/transport" description="vehicles in fleet" />
                    <StatCard title="Awards" value={kpis.awards} icon={Medal} href="/awards" description="trophies & accolades" />
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
    </div>

    {dialogData && (
        <>
            <SchoolDialog mode="add" open={dialogState.school} onOpenChange={(open) => setDialogState(s => ({...s, school: open}))} />
            <TeamDialog mode="add" open={dialogState.team} onOpenChange={(open) => setDialogState(s => ({...s, team: open}))} schools={dialogData.schools} divisions={dialogData.divisions} seasons={dialogData.seasons} />
            <CompetitionDialog mode="add" open={dialogState.competition} onOpenChange={(open) => setDialogState(s => ({...s, competition: open}))} seasons={dialogData.seasons} divisions={dialogData.divisions} teams={dialogData.teams} sponsors={[]}/>
            <FieldDialog mode="add" open={dialogState.field} onOpenChange={(open) => setDialogState(s => ({...s, field: open}))} schools={dialogData.schools} groundkeepers={dialogData.groundskeeper} />
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
