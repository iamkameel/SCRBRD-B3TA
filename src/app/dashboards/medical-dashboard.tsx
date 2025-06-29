
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { format } from 'date-fns';
import { Stethoscope } from 'lucide-react';
import type { Match } from "@/lib/data";

interface MedicalDashboardProps {
  matches: Match[];
}

export default function MedicalDashboard({ matches }: MedicalDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Medical Staff Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of upcoming matches across the league.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
          <CardDescription>Be prepared for all scheduled matches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Competition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.matchId}>
                    <TableCell className="font-medium">
                      <Link href={`/matches/${match.matchId}`} className="hover:underline">
                        {match.teamAName} vs {match.teamBName}
                      </Link>
                    </TableCell>
                    <TableCell>{format(match.dateTime, "PPP p")}</TableCell>
                    <TableCell>{match.fieldName}</TableCell>
                    <TableCell>{match.competitionName}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    There are no upcoming matches scheduled.
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
