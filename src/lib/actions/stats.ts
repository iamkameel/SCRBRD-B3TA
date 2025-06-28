'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { PlayerStats, PlayerMatchPerformance } from '@/lib/data';
import { getScorecard, getMatchLineup } from './matches';
import { getPerson } from './players';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getPlayerStats(personId: string): Promise<PlayerStats> {
    const defaultStats: PlayerStats = {
        matchesPlayed: 0, inningsBatted: 0, notOuts: 0, totalRuns: 0, highestScore: 0, highestScoreNotOut: false, ballsFaced: 0, hundreds: 0, fifties: 0, fours: 0, sixes: 0,
        oversBowled: 0, runsConceded: 0, maidens: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0,
        catches: 0, stumpings: 0,
        battingAverage: 0, strikeRate: 0, bowlingAverage: 0, economyRate: 0, bestBowling: "0/0",
    };

    const person = await getPerson(personId);
    if (!person || !person.roles.includes("Player")) {
        return defaultStats;
    }
    const personName = `${person.firstName} ${person.lastName}`;

    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("status", "==", "completed"));
    const completedMatchesSnapshot = await getDocs(q);

    let stats = { ...defaultStats };

    for (const matchDoc of completedMatchesSnapshot.docs) {
        const lineupA = await getMatchLineup(matchDoc.id, matchDoc.data().teamAId);
        const lineupB = await getMatchLineup(matchDoc.id, matchDoc.data().teamBId);
        const playerIsInMatch = [...lineupA, ...lineupB].includes(personId);
        
        if (!playerIsInMatch) continue;

        const scorecard = await getScorecard(matchDoc.id);
        if (!scorecard) continue;

        stats.matchesPlayed++;

        for (const innings of [scorecard.innings1, scorecard.innings2]) {
            const battingEntry = innings.battingCard.find(b => b.name === personName);
            if (battingEntry && battingEntry.balls > 0) { // Only count if they faced a ball
                stats.inningsBatted++;
                stats.totalRuns += battingEntry.runs;
                stats.ballsFaced += battingEntry.balls;
                const isNotOut = battingEntry.status.toLowerCase().includes('not out');
                
                if (battingEntry.runs > stats.highestScore) {
                    stats.highestScore = battingEntry.runs;
                    stats.highestScoreNotOut = isNotOut;
                } else if (battingEntry.runs === stats.highestScore && !stats.highestScoreNotOut && isNotOut) {
                    stats.highestScoreNotOut = true;
                }

                if (isNotOut) {
                    stats.notOuts++;
                }
                if (battingEntry.runs >= 100) stats.hundreds++;
                else if (battingEntry.runs >= 50) stats.fifties++;
                stats.fours += battingEntry.fours;
                stats.sixes += battingEntry.sixes;
            }

            const bowlingEntry = innings.bowlingCard.find(b => b.name === personName);
            if (bowlingEntry) {
                stats.oversBowled += bowlingEntry.overs;
                stats.runsConceded += bowlingEntry.runs;
                stats.maidens += bowlingEntry.maidens;
                stats.wicketsTaken += bowlingEntry.wickets;

                if (stats.bestBowlingWickets === 0 || bowlingEntry.wickets > stats.bestBowlingWickets || (bowlingEntry.wickets === stats.bestBowlingWickets && bowlingEntry.runs < stats.bestBowlingRuns)) {
                    stats.bestBowlingWickets = bowlingEntry.wickets;
                    stats.bestBowlingRuns = bowlingEntry.runs;
                }
            }
        }
    }
    
    const dismissals = stats.inningsBatted - stats.notOuts;
    stats.battingAverage = dismissals > 0 ? stats.totalRuns / dismissals : 0;
    stats.strikeRate = stats.ballsFaced > 0 ? (stats.totalRuns / stats.ballsFaced) * 100 : 0;
    stats.bowlingAverage = stats.wicketsTaken > 0 ? stats.runsConceded / stats.wicketsTaken : 0;
    stats.economyRate = stats.oversBowled > 0 ? stats.runsConceded / stats.oversBowled : 0;
    stats.bestBowling = `${stats.bestBowlingWickets}/${stats.bestBowlingRuns}`;

    return stats;
}

export async function getPlayerMatchHistory(personId: string): Promise<PlayerMatchPerformance[]> {
    const person = await getPerson(personId);
    if (!person || !person.roles.includes("Player")) {
        return [];
    }
    const personName = `${person.firstName} ${person.lastName}`;

    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("status", "==", "completed"));
    const completedMatchesSnapshot = await getDocs(q);

    const playerMatchPerformances: PlayerMatchPerformance[] = [];

    for (const matchDoc of completedMatchesSnapshot.docs) {
        const matchData = matchDoc.data();
        const lineupA = await getMatchLineup(matchDoc.id, matchData.teamAId);
        const lineupB = await getMatchLineup(matchDoc.id, matchData.teamBId);
        
        const playerTeamId = lineupA.includes(personId) ? matchData.teamAId : lineupB.includes(personId) ? matchData.teamBId : null;
        if (!playerTeamId) continue;
        
        const opponentName = playerTeamId === matchData.teamAId ? matchData.teamBName : matchData.teamAName;

        const scorecard = await getScorecard(matchDoc.id);
        if (!scorecard) continue;

        const battingInnings = scorecard.innings1.battingCard.find(b => b.name === personName) || scorecard.innings2.battingCard.find(b => b.name === personName);
        const bowlingInnings = scorecard.innings1.bowlingCard.find(b => b.name === personName) || scorecard.innings2.bowlingCard.find(b => b.name === personName);

        if (!battingInnings && !bowlingInnings) continue; // Player might be in lineup but not bat or bowl

        playerMatchPerformances.push({
            opponent: `vs ${opponentName}`,
            date: (matchData.dateTime as Timestamp).toDate(),
            matchId: matchDoc.id,
            runsScored: battingInnings?.runs,
            ballsFaced: battingInnings?.balls,
            battingStatus: battingInnings?.status,
            oversBowled: bowlingInnings?.overs,
            runsConceded: bowlingInnings?.runs,
            wicketsTaken: bowlingInnings?.wickets,
        });
    }

    return playerMatchPerformances
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
}
