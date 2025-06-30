
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/actions/sessions';
import { getDrills } from '@/lib/actions/drills';
import SessionDetailsClient from './client';

export default async function SessionDetailsPage({ params }: { params: { sessionId: string } }) {
    const [session, drills] = await Promise.all([
        getSession(params.sessionId),
        getDrills()
    ]);

    if (!session) {
        notFound();
    }
    
    return <SessionDetailsClient session={session} drillLibrary={drills} />;
}
