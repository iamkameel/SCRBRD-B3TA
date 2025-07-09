
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MapPin, Shield, Trophy, UserCog, ArrowRight, Mail, ThumbsUp, ThumbsDown, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from "date-fns";
import type { Competition, Team, Person, Field, AssignmentRequest, Match, MatchStatus } from '@/lib/data';
import { getSportsmasterDashboardData } from '@/lib/actions/dashboard';
import DashboardSkeleton from '@/app/loading';
import { reviewAssignmentRequestAction } from '@/lib/actions/requests';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
    kpis: {
        competitions: number;
        teams: number;
        players: number;
        fields: number;
    };
    pendingRequests: AssignmentRequest[];
    matches: Match[];
}

function FixturesCard({ matches }: { matches: Match[] }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<MatchStatus | 'all'>('scheduled');

    const filteredMatches = React.useMemo(() => {
        return matches.filter(match => {
            const searchMatch = `${match.teamAName} ${match.teamBName} ${match.competitionName} ${match.fieldName}`.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || match.status === statusFilter;
            return searchMatch && statusMatch;
        });
    }, [matches, searchTerm, statusFilter]);
    
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Fixtures Overview</CardTitle>
                <CardDescription>A list of all fixtures across your assigned schools.</CardDescription>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search fixtures..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="postponed">Postponed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Match</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map((match) => (
                            <TableRow key={match.matchId}>
                                <TableCell className="font-medium">
                                    <Link href={`/matches/${match.matchId}`} className="hover:underline flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5"><AvatarImage src={match.teamALogoUrl} /><AvatarFallback>{match.teamAName[0]}</AvatarFallback></Avatar>
                                                <span>{match.teamAName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5"><AvatarImage src={match.teamBLogoUrl} /><AvatarFallback>{match.teamBName[0]}</AvatarFallback></Avatar>
                                                <span>{match.teamBName}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>{format(match.dateTime, "dd MMM, p")}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">No fixtures found matching your criteria.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function SportsmasterDashboard() {
  const [data, setData] = React.useState<SportsmasterDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);
  const { person } = useAuth();

  React.useEffect(() => {
    if (person?.personId) {
        setLoading(true);
        getSportsmasterDashboardData().then(fetchedData => {
            setData(fetchedData as SportsmasterDashboardData);
            setLoading(false);
            }).catch(error => {
            console.error("Failed to load sportsmaster dashboard data:", error);
            setLoading(false);
        });
    }
  }, [person, isPending]); // Re-fetch data when a review is processed or person changes

  const handleReview = (requestId: string, decision: 'approve' | 'deny') => {
    startTransition(async () => {
        setReviewingId(requestId);
        try {
            await reviewAssignmentRequestAction({ requestId, decision });
            toast({ title: 'Request Reviewed', description: `The request has been ${decision}d.`});
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : "Could not review request.", variant: "destructive"});
        } finally {
            setReviewingId(null);
        }
    });
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const {
    kpis,
    pendingRequests,
    matches,
  } = data;
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Sportsmaster Dashboard</h1>
        <p className="text-sm opacity-90">Strategic oversight for your assigned schools and districts.</p>
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
                                        <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-100" onClick={() => handleReview(req.requestId, 'approve')} disabled={isPending}>
                                            {isPending && reviewingId === req.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                        </Button>
                                         <Button size="icon" variant="outline" className="text-red-600 hover:bg-red-100" onClick={() => handleReview(req.requestId, 'deny')} disabled={isPending}>
                                            {isPending && reviewingId === req.requestId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader><CardTitle>Global Overview</CardTitle><CardDescription>High-level metrics across all schools and divisions you oversee.</CardDescription></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <StatCard title="Competitions" value={kpis.competitions} icon={Shield} description="active this season" />
                        <StatCard title="Teams" value={kpis.teams} icon={Users} description="across all divisions"/>
                        <StatCard title="Players" value={kpis.players} icon={Users} description="registered" />
                        <StatCard title="Fields & Venues" value={kpis.fields} icon={MapPin} description="available for booking" />
                    </CardContent>
                </Card>
            
                <Card>
                    <CardHeader>
                        <CardTitle>Management Hub</CardTitle>
                        <CardDescription>Quick access to key management areas.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Link href="/teams" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <Users className="w-8 h-8 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">Team Management</h3>
                                    <p className="text-sm text-muted-foreground">Assign players and staff to rosters.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/competitions" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <Trophy className="w-8 h-8 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">Competition Management</h3>
                                    <p className="text-sm text-muted-foreground">Create and manage leagues and cups.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/matches" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <Users className="w-8 h-8 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">Fixture Management</h3>
                                    <p className="text-sm text-muted-foreground">Schedule and update matches.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/people" className="block p-4 transition-colors border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <UserCog className="w-8 h-8 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">Personnel Management</h3>
                                    <p className="text-sm text-muted-foreground">View all registered people.</p>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <FixturesCard matches={matches} />
            </div>
        </div>
    </div>
  );
}
