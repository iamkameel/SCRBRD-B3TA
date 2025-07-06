
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { format } from 'date-fns';
import { Bus } from 'lucide-react';
import type { FullTransportAssignment } from "@/lib/data";
import { useAuth } from '@/lib/auth-context';
import { getAssignmentsForDriver } from '@/lib/actions/transport';
import DashboardSkeleton from '@/app/loading';

function DriverDashboardInternal({ assignments }: { assignments: FullTransportAssignment[] }) {
  const { person } = useAuth();
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        <p className="text-sm opacity-90">Welcome, {person?.firstName}! Here are your upcoming transport duties.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Assignments</CardTitle>
          <CardDescription>Matches you have been assigned to as a driver.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Vehicle Type</TableHead>
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
                    <TableCell>{assignment.vehicleName}</TableCell>
                    <TableCell>{assignment.vehicleType}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                     <Bus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    You have no upcoming driving assignments.
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

export default function DriverDashboard() {
  const { person } = useAuth();
  const [assignments, setAssignments] = React.useState<FullTransportAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person?.personId) {
      getAssignmentsForDriver(person.personId).then(fetchedAssignments => {
        setAssignments(fetchedAssignments);
        setLoading(false);
      });
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <DriverDashboardInternal assignments={assignments} />;
}
