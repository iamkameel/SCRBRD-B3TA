

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PersonDetailsClient from './client';
import { getPerson, getPersonLinks, getPlayers } from '@/lib/actions/players';
import { getPersonTeamAssignments } from '@/lib/actions/teams';
import { getPlayerStats, getPlayerMatchHistory } from '@/lib/actions/stats';
import { Button } from '@/components/ui/button';

export default async function PersonDetailsPage({ params }: { params: { personId: string } }) {
  
  const [person, { guardians, children }, allPeople, playerStats, teamAssignments, matchHistory] = await Promise.all([
    getPerson(params.personId),
    getPersonLinks(params.personId),
    getPlayers(),
    getPlayerStats(params.personId),
    getPersonTeamAssignments(params.personId),
    getPlayerMatchHistory(params.personId),
  ]);

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Person not found</h2>
        <p className="text-muted-foreground">The person you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/people"><ArrowLeft className="mr-2" /> Back to People</Link>
        </Button>
      </div>
    );
  }

  // Filter out the current person and anyone already linked
  const existingLinkIds = new Set([
      person.personId,
      ...guardians.map(g => g.personId),
      ...children.map(c => c.personId)
  ]);
  const availablePeople = allPeople.filter(p => !existingLinkIds.has(p.personId));

  return (
    <PersonDetailsClient 
        person={person}
        playerStats={playerStats}
        initialGuardians={guardians} 
        initialChildren={children}
        availablePeople={availablePeople}
        teamAssignments={teamAssignments}
        matchHistory={matchHistory}
    />
  );
}
