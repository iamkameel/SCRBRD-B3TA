import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { format } from 'date-fns';
import { Bus } from 'lucide-react';
import type { FullTransportAssignment } from "@/lib/data";

interface DriverDashboardProps {
  assignments: FullTransportAssignment[];
}

export default function DriverDashboard({ assignments }: DriverDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Driver Dashboard
        </h1>
        <p className="text-muted-foreground">
          Your upcoming transport duties.
        </p>
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
                     <Bus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
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
