
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { format } from 'date-fns';
import { Whistle } from 'lucide-react';
import type { Official } from "@/lib/data";

interface UmpireScorerDashboardProps {
  assignments: (Official & { matchId: string; matchName: string; dateTime: Date; })[];
}

export default function UmpireScorerDashboard({ assignments }: UmpireScorerDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Officials Dashboard
        </h1>
        <p className="text-muted-foreground">
          Here are your upcoming match assignments.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Upcoming Matches</CardTitle>
          <CardDescription>Matches you have been assigned to as an umpire or scorer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <TableRow key={assignment.assignmentId}>
                    <TableCell className="font-medium">
                      <Link href={`/matches/${assignment.matchId}`} className="hover:underline">
                        {assignment.matchName}
                      </Link>
                    </TableCell>
                    <TableCell>{format(assignment.dateTime, "PPP p")}</TableCell>
                    <TableCell>{assignment.role}</TableCell>
                    <TableCell><Badge variant={assignment.confirmed ? "secondary" : "outline"}>{assignment.confirmed ? "Confirmed" : "Pending"}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Whistle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    You have no upcoming match assignments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
