'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { format } from 'date-fns';
import { Check, Clock, RadioTower, ArrowRight, ClipboardList, Camera } from 'lucide-react';
import type { Official, MatchStatus } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { acceptAssignmentAction, getOfficialAssignmentsForPerson } from "@/lib/actions/matches";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSkeleton from "@/app/loading";


interface AssignmentRowProps {
  assignment: (Official & { matchId: string; matchName: string; dateTime: Date; status: MatchStatus });
}

function AssignmentRow({ assignment }: AssignmentRowProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();

    const handleAccept = () => {
        startTransition(async () => {
            try {
                await acceptAssignmentAction(assignment.matchId, assignment.assignmentId);
                toast({ title: "Assignment Accepted", description: "Your confirmation has been recorded." });
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not accept assignment.", variant: "destructive" });
            }
        });
    };

    const actionButton = () => {
        if (assignment.status === 'live') {
            return <Button asChild size="sm"><Link href={`/matches/${assignment.matchId}`}>Go to Live Scoring<ArrowRight className="ml-2" /></Link></Button>;
        }
        if (assignment.status === 'scheduled' && !assignment.confirmed) {
            return <Button onClick={handleAccept} disabled={isPending} size="sm">{isPending ? "Accepting..." : "Accept Assignment"}</Button>
        }
        return <Button asChild size="sm" variant="outline"><Link href={`/matches/${assignment.matchId}`}>View Match</Link></Button>
    }

    return (
        <TableRow key={assignment.assignmentId}>
            <TableCell className="font-medium">
                <Link href={`/matches/${assignment.matchId}`} className="hover:underline">
                    {assignment.matchName}
                </Link>
            </TableCell>
            <TableCell>{format(assignment.dateTime, "PPP p")}</TableCell>
            <TableCell>{assignment.role}</TableCell>
            <TableCell><Badge variant={assignment.confirmed ? "secondary" : "outline"} className={cn(assignment.confirmed ? 'bg-green-100 text-green-800' : '')}>{assignment.confirmed ? <Check className="mr-1" /> : <Clock className="mr-1" />} {assignment.confirmed ? "Confirmed" : "Pending"}</Badge></TableCell>
            <TableCell className="text-right">
                {actionButton()}
            </TableCell>
        </TableRow>
    );
}

interface UmpireScorerDashboardInternalProps {
  assignments: (Official & { matchId: string; matchName: string; dateTime: Date; status: MatchStatus })[];
}

function UmpireScorerDashboardInternal({ assignments }: UmpireScorerDashboardInternalProps) {
  const now = new Date();

  const liveAssignments = assignments.filter(a => a.status === 'live');
  const upcomingAssignments = assignments.filter(a => a.status === 'scheduled' && a.dateTime >= now);
  const completedAssignments = assignments.filter(a => a.status !== 'live' && a.status !== 'scheduled' || (a.status === 'scheduled' && a.dateTime < now));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Officials Dashboard
        </h1>
        <p className="text-muted-foreground">
          Your upcoming match assignments and tasks.
        </p>
      </header>

      {liveAssignments.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-500/50">
            <RadioTower className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-900 dark:text-red-300 font-bold">You have a live match!</AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-400">
                A match you are assigned to is currently in progress.
            </AlertDescription>
        </Alert>
      )}

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Camera /> AI Umpire Review
              </CardTitle>
              <CardDescription>
                  Have a close call? Upload an image of an LBW appeal to get a simulated third umpire decision.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                  <Link href="/umpire-review">
                      Go to Umpire Review <ArrowRight className="ml-2" />
                  </Link>
              </Button>
          </CardContent>
      </Card>
      
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live Now ({liveAssignments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingAssignments.length})</TabsTrigger>
            <TabsTrigger value="completed">History ({completedAssignments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Live Matches</CardTitle>
                    <CardDescription>Matches that are currently in progress.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow><TableHead>Match</TableHead><TableHead>Time</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {liveAssignments.length > 0 ? (
                                liveAssignments.map((assignment) => <AssignmentRow key={assignment.assignmentId} assignment={assignment} />)
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />No matches are currently live.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Assignments</CardTitle>
                    <CardDescription>Matches you are scheduled to officiate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Match</TableHead><TableHead>Date & Time</TableHead><TableHead>Your Role</TableHead><TableHead>Confirmation</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {upcomingAssignments.length > 0 ? (
                                upcomingAssignments.map((assignment) => <AssignmentRow key={assignment.assignmentId} assignment={assignment} />)
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />You have no upcoming match assignments.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle>Assignment History</CardTitle>
                    <CardDescription>Past matches you have officiated.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                           <TableRow><TableHead>Match</TableHead><TableHead>Date</TableHead><TableHead>Your Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {completedAssignments.length > 0 ? (
                                completedAssignments.map((assignment) => <AssignmentRow key={assignment.assignmentId} assignment={assignment} />)
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No completed assignments found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UmpireScorerDashboard() {
  const { person } = useAuth();
  const [assignments, setAssignments] = React.useState<UmpireScorerDashboardInternalProps['assignments']>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getOfficialAssignmentsForPerson(person.personId).then(fetchedAssignments => {
        setAssignments(fetchedAssignments);
        setLoading(false);
      });
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }
  
  return <UmpireScorerDashboardInternal assignments={assignments} />;
}
