

'use server';

import type { Match, Team } from '@/lib/data';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserId } from '@/lib/firebase-admin';
import { getMatches } from './matches';
import { getTeams } from './teams';
import type { FixtureConflict, AssignmentRequest } from '../data';


export async function getFixtureConflicts(): Promise<FixtureConflict[]> {
    const userId = await getUserId();
    if (!userId) return [];

    const [allMatches, allTeams] = await Promise.all([
        getMatches(),
        getTeams()
    ]);

    const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
    const teamMap = new Map<string, Team>(allTeams.map(t => [t.teamId, t]));
    const conflicts: FixtureConflict[] = [];
    const conflictPairs = new Set<string>();

    if (scheduledMatches.length < 2) {
        return [];
    }

    for (let i = 0; i < scheduledMatches.length; i++) {
        for (let j = i + 1; j < scheduledMatches.length; j++) {
            const matchA = scheduledMatches[i];
            const matchB = scheduledMatches[j];

            const pairKey = [matchA.matchId, matchB.matchId].sort().join('-');
            if (conflictPairs.has(pairKey)) continue;

            const MATCH_DURATION_HOURS = 4;
            const startTimeA = matchA.dateTime.getTime();
            const endTimeA = new Date(startTimeA).setHours(new Date(startTimeA).getHours() + MATCH_DURATION_HOURS);
            const startTimeB = matchB.dateTime.getTime();
            const endTimeB = new Date(startTimeB).setHours(new Date(startTimeB).getHours() + MATCH_DURATION_HOURS);

            const timesOverlap = (startTimeA < endTimeB) && (endTimeA > startTimeB);

            if (timesOverlap) {
                // Check for field conflict
                if (matchA.fieldId === matchB.fieldId) {
                    conflicts.push({
                        type: 'Field',
                        message: `Field "${matchA.fieldName}" is double-booked for matches at ${matchA.dateTime.toLocaleTimeString()} and ${matchB.dateTime.toLocaleTimeString()}.`,
                        matches: [matchA, matchB]
                    });
                    conflictPairs.add(pairKey);
                    continue; // A field clash is the most severe, so we can stop checking this pair.
                }

                // Check for team conflicts
                const teamsA = [matchA.teamAId, matchA.teamBId].filter(Boolean);
                const teamsB = [matchB.teamAId, matchB.teamBId].filter(Boolean);
                const conflictingTeamId = teamsA.find(id => teamsB.includes(id as string));
                
                if (conflictingTeamId) {
                    const teamName = teamMap.get(conflictingTeamId)?.name || 'A team';
                    conflicts.push({
                        type: 'Team',
                        message: `Team "${teamName}" has overlapping fixtures scheduled.`,
                        matches: [matchA, matchB]
                    });
                    conflictPairs.add(pairKey);
                }
            }
        }
    }

    return conflicts;
}

export async function getUnconfirmedAssignmentsCount(personId: string): Promise<number> {
    const authedUserId = await getUserId();
    if (!authedUserId) return 0; // Auth check
    
    if (!personId) return 0;
    
    try {
        const q = query(
            collectionGroup(db, 'officials'), 
            where('personId', '==', personId), 
            where('confirmed', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch(error) {
        console.error("Error fetching unconfirmed assignments count:", error);
        return 0;
    }
}
