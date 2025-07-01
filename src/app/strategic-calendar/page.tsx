
import { getMatches } from '@/lib/actions/matches';
import { getCompetitions } from '@/lib/actions/competitions';
import { getDivisions } from '@/lib/actions/divisions';
import StrategicCalendarClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default async function StrategicCalendarPage() {
    const userId = await getUserId();
    const user = userId ? await getPerson(userId) : null;

    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        return (
            <Card className="w-full max-w-md mx-auto mt-16">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view the strategic calendar.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    const [matches, competitions, divisions] = await Promise.all([
        getMatches(),
        getCompetitions(),
        getDivisions(),
    ]);

    return <StrategicCalendarClient matches={matches} competitions={competitions} divisions={divisions} />;
}
