

'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { PlayerTrackerData, PerformanceEntry, SkillRating, TrainingLog, InjuryRecord, Availability, Milestone, ShotData, RunMapData } from '@/lib/data';
import { cache } from 'react';

const calculateRunMap = (performances: PerformanceEntry[]): RunMapData => {
    const runMap: RunMapData = {
        fineLeg: 0,
        squareLeg: 0,
        midWicket: 0,
        longOn: 0,
        cover: 0,
        point: 0,
    };
    let totalRuns = 0;

    const allShots = performances.flatMap(p => p.wagonWheel || []);

    if (allShots.length === 0) return runMap;

    allShots.forEach(shot => {
        totalRuns += shot.runs;
        const angle = shot.angle;
        // Angles: 0 is right (Cover), 90 is down (Long On), 180 is left (Mid-wicket), 270 is up (Point/Fine Leg)
        if (angle >= 225 && angle < 315) { // Point
            runMap.point += shot.runs;
        } else if (angle >= 315 || angle < 45) { // Cover
            runMap.cover += shot.runs;
        } else if (angle >= 45 && angle < 90) { // Long On
            runMap.longOn += shot.runs;
        } else if (angle >= 90 && angle < 135) { // Mid-Wicket
            runMap.midWicket += shot.runs;
        } else if (angle >= 135 && angle < 225) { // Square Leg
            runMap.squareLeg += shot.runs;
        }
        // Fine leg is often behind square, grouping with point for simplicity here.
        // A more granular model could be used if needed.
    });

    if (totalRuns > 0) {
        runMap.fineLeg = Math.round((runMap.point / totalRuns) * 100);
        runMap.squareLeg = Math.round((runMap.squareLeg / totalRuns) * 100);
        runMap.midWicket = Math.round((runMap.midWicket / totalRuns) * 100);
        runMap.longOn = Math.round((runMap.longOn / totalRuns) * 100);
        runMap.cover = Math.round((runMap.cover / totalRuns) * 100);
        runMap.point = Math.round((runMap.point / totalRuns) * 100);
        
        // Normalize to sum to 100%
        let currentTotal = Object.values(runMap).reduce((sum, val) => sum + val, 0);
        if (currentTotal > 100) {
            runMap.cover -= (currentTotal - 100); // Adjust largest category
        }
    }
    
    return runMap;
};


export const getPlayerTrackerData = cache(async (playerId: string): Promise<PlayerTrackerData> => {
    // This is where you would fetch data from all the subcollections.
    // For now, we return mock data to build the UI.
    const now = new Date();
    const pastDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
    };
    
    const performanceEntries = [
        { entryId: 'pe1', date: pastDate(30), matchId: 'match_1', runs: 25, ballsFaced: 20, wickets: 0, oversBowled: 0, wagonWheel: [{angle: 45, runs: 4, distance: 0.8, batsmanId: playerId}], strikeRate: 125, economyRate: 0 },
        { entryId: 'pe2', date: pastDate(23), matchId: 'match_2', runs: 56, ballsFaced: 40, wickets: 1, oversBowled: 4, wagonWheel: [{angle: 90, runs: 6, distance: 0.95, batsmanId: playerId}], strikeRate: 140, economyRate: 6.5 },
        { entryId: 'pe3', date: pastDate(15), matchId: 'match_3', runs: 12, ballsFaced: 18, wickets: 2, oversBowled: 4, wagonWheel: [{angle: 135, runs: 1, distance: 0.4, batsmanId: playerId}], strikeRate: 66.67, economyRate: 5.75 },
        { entryId: 'pe4', date: pastDate(7), matchId: 'match_4', runs: 78, ballsFaced: 50, wickets: 0, oversBowled: 0, wagonWheel: [{angle: 315, runs: 4, distance: 0.7, batsmanId: playerId}], strikeRate: 156, economyRate: 0 },
        { entryId: 'pe5', date: pastDate(2), matchId: 'match_5', runs: 33, ballsFaced: 25, wickets: 3, oversBowled: 3.2, wagonWheel: [{angle: 270, runs: 2, distance: 0.6, batsmanId: playerId}], strikeRate: 132, economyRate: 7.8 },
    ];

    const runMap = calculateRunMap(performanceEntries);

    return {
        performanceEntries,
        skillRatings: [
            { ratingId: 'sr1', date: pastDate(90), batting: 70, bowling: 65, fielding: 75, fitness: 80 },
            { ratingId: 'sr2', date: pastDate(30), batting: 75, bowling: 68, fielding: 78, fitness: 85, coachNotes: "Noticeable improvement in running between the wickets." },
        ],
        trainingLogs: [
            { logId: 'tl1', date: pastDate(5), drillType: 'Net Session', durationMins: 60, coachNotes: "Focused on playing the short ball." },
            { logId: 'tl2', date: pastDate(3), drillType: 'Fielding Drills', durationMins: 45, coachNotes: "High-intensity catching practice." },
        ],
        injuryRecords: [
            { recordId: 'ir1', injuryType: 'Minor Hamstring Strain', startDate: pastDate(45), endDate: pastDate(38), severity: 'Minor', status: 'Recovered' },
        ],
        availability: [
            { availId: 'av1', startDate: pastDate(-5), endDate: pastDate(-7), reason: 'School Exams', status: 'Unavailable' }
        ],
        milestones: [
            { milestoneId: 'ms1', name: '1000 Career Runs', achievedDate: pastDate(7) },
            { milestoneId: 'ms2', name: '50th T20 Match', achievedDate: pastDate(30) },
        ],
        runMap,
    };
});
