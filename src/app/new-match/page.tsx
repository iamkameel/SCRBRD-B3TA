
'use server';

import { getTeams } from '@/lib/actions/teams';
import { getCompetitions } from '@/lib/actions/competitions';
import { getFields } from '@/lib/actions/fields';
import { getSeasons } from '@/lib/actions/seasons';
import { getDivisions } from '@/lib/actions/divisions';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import NewMatchPageClient from './new-match-page-client';

export default async function NewMatchPage() {
  const [teams, competitions, fields, seasons, divisions, userId] = await Promise.all([
    getTeams(),
    getCompetitions(),
    getFields(),
    getSeasons(),
    getDivisions(),
    getUserId(),
  ]);

  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  if (!isAdmin) {
    return (
        <Card className="w-full max-w-md mx-auto mt-16">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4">Access Denied</CardTitle>
                <CardDescription>
                    You do not have permission to create new matches.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }
  
  return <NewMatchPageClient teams={teams} competitions={competitions} fields={fields} seasons={seasons} divisions={divisions} />;
}
