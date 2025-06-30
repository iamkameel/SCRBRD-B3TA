
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { format } from 'date-fns';
import { Stethoscope } from 'lucide-react';
import type { Match } from "@/lib/data";
import { useAuth } from '@/lib/auth-context';
import { getMatches } from '@/lib/actions/matches';
import DashboardSkeleton from '@/app/loading';

function MedicalDashboardInternal({ matches }: { matches: Match[] }) {
  const [isClient, setIsClient] = React.useState(false);
  const { person } = useAuth();
  
  React.useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Medical Staff Dashboard</h1>
        <p className="text-sm opacity-90">Welcome, {person?.activeRole}! Overview of upcoming matches.</p>
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
                    <TableCell>{isClient ? format(match.dateTime, "PPP p") : '...'}</TableCell>
                    <TableCell>{match.fieldName}</TableCell>
                    <TableCell>{match.competitionName}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Stethoscope className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
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

export default function MedicalDashboard() {
  const { person } = useAuth();
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person) { // Medical staff needs to be logged in.
      getMatches().then(allMatches => {
        const upcoming = allMatches
            .filter(m => m.status === 'scheduled' || m.status === 'live')
            .sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());
        setMatches(upcoming);
        setLoading(false);
      });
    } else if (person === null) {
        setLoading(false);
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <MedicalDashboardInternal matches={matches} />;
}
