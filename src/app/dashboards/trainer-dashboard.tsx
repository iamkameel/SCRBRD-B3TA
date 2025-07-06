
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { Dumbbell, ClipboardList, User } from 'lucide-react';
import type { Person } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';
import { getPeopleByRole } from '@/lib/actions/players';
import DashboardSkeleton from '@/app/loading';


interface TrainerDashboardInternalProps {
  players: Person[];
}

function TrainerDashboardInternal({ players }: TrainerDashboardInternalProps) {
  const { person } = useAuth();
  
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-gradient-to-r from-[#069669] to-[#3ac96f] text-primary-foreground p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Trainer Dashboard</h1>
        <p className="text-sm opacity-90">Manage fitness programs and track athlete progress.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col items-center justify-center text-center p-8">
             <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
             <CardTitle>Training Program Designer</CardTitle>
             <CardDescription className="mt-2">Create and assign customized conditioning programs.</CardDescription>
             <Button disabled className="mt-4">Coming Soon</Button>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-8">
             <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
             <CardTitle>Fitness Assessments</CardTitle>
             <CardDescription className="mt-2">Schedule and log fitness test results for players.</CardDescription>
             <Button disabled className="mt-4">Coming Soon</Button>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Athlete Roster</CardTitle>
          <CardDescription>An overview of all players you can manage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.personId}>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={player.profileImageUrl} alt={`${player.firstName} ${player.lastName}`} />
                            <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span>{player.firstName} {player.lastName}</span>
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/people/${player.personId}`}>
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No players found in the system.
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


export default function TrainerDashboard() {
  const { person } = useAuth();
  const [players, setPlayers] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (person) {
      getPeopleByRole('Player').then(fetchedPlayers => {
        setPlayers(fetchedPlayers);
        setLoading(false);
      });
    } else if (person === null) {
      setLoading(false);
    }
  }, [person]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <TrainerDashboardInternal players={players} />;
}
