
'use server';

import PlannerClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { getCoachDashboardData } from '@/lib/actions/dashboard';
import { getSessionsByTeam } from '@/lib/actions/sessions';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PlannerPage() {
    const userId = await getUserId();
    if (!userId) {
        // Or redirect to login
        return <Card><CardHeader><CardTitle>Unauthorized</CardTitle><CardDescription>You must be logged in to view the planner.</CardDescription></CardHeader></Card>
    }
    
    const coachData = await getCoachDashboardData(userId);

    if (!coachData.team) {
        return <PlannerClient sessions={[]} team={null} />;
    }

    const sessions = await getSessionsByTeam(coachData.team.teamId);
    
    return <PlannerClient sessions={sessions} team={coachData.team} />;
}
