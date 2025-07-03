
import StrategicCalendarClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match, Competition, Division, Team } from '@/lib/data';

async function getAllMatches(): Promise<Match[]> {
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection);
    
    const [teams, matchSnapshot] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(q),
    ]);
    
    const teamInfoMap = new Map<string, any>();
    teams.forEach(team => {
      teamInfoMap.set(team.id, team.data());
    });

    const matchesList = matchSnapshot.docs.map(doc => {
      const data = doc.data();
      const teamA = teamInfoMap.get(data.teamAId);
      const teamB = teamInfoMap.get(data.teamBId);
      return {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamAColor: teamA?.teamColors?.primary,
        teamBColor: teamB?.teamColors?.primary,
        teamALogoUrl: teamA?.logoUrl,
        teamBLogoUrl: teamB?.logoUrl,
      } as Match;
    });
    return matchesList.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  } catch (error) {
    console.error("Error fetching all matches for admin:", error);
    return [];
  }
}

async function getAllCompetitions(): Promise<Competition[]> {
  try {
    const snapshot = await getDocs(collection(db, 'competitions'));
    return snapshot.docs.map(doc => ({ competitionId: doc.id, ...doc.data() } as Competition));
  } catch (error) {
    console.error("Error fetching all competitions for admin:", error);
    return [];
  }
}

async function getAllDivisions(): Promise<Division[]> {
  try {
    const snapshot = await getDocs(collection(db, 'divisions'));
    return snapshot.docs.map(doc => ({ divisionId: doc.id, ...doc.data() } as Division));
  } catch (error) {
    console.error("Error fetching all divisions for admin:", error);
    return [];
  }
}


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
        getAllMatches(),
        getAllCompetitions(),
        getAllDivisions(),
    ]);

    return <StrategicCalendarClient matches={matches} competitions={competitions} divisions={divisions} />;
}
