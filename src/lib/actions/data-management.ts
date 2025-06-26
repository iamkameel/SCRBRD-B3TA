
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { sampleData } from '@/lib/sample-data';
import { getPlayers, deletePlayerAction } from './players';
import { getTeams, deleteTeamAction } from './teams';
import { getMatches, deleteMatchAction } from './matches';
import { getSchools, deleteSchoolAction } from './schools';
import { getDivisions, deleteDivisionAction } from './divisions';
import { getSeasons, deleteSeasonAction } from './seasons';
import { getFields, deleteFieldAction } from './fields';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

async function deleteAllDataAction(): Promise<{ success: boolean; message: string }> {
    try {
        const subsets = ["Matches", "Teams", "People", "Fields", "Seasons", "Divisions", "Schools"];
        for (const subset of subsets) {
            const getAction = {
                'People': getPlayers, 'Teams': getTeams, 'Matches': getMatches, 'Schools': getSchools, 
                'Divisions': getDivisions, 'Seasons': getSeasons, 'Fields': getFields
            }[subset];
            const deleteAction = {
                'People': deletePlayerAction, 'Teams': deleteTeamAction, 'Matches': deleteMatchAction, 'Schools': deleteSchoolAction, 
                'Divisions': deleteDivisionAction, 'Seasons': deleteSeasonAction, 'Fields': deleteFieldAction
            }[subset];
            const idKey = {
                'People': 'personId', 'Teams': 'teamId', 'Matches': 'matchId', 'Schools': 'schoolId',
                'Divisions': 'divisionId', 'Seasons': 'seasonId', 'Fields': 'fieldId'
            }[subset];
            
            // @ts-ignore
            const items = await getAction();
            // @ts-ignore
            for (const item of items) {
                // @ts-ignore
                await deleteAction(item[idKey]);
            }
        }
        return { success: true, message: "All application data has been deleted." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete all data.";
        console.error(message);
        return { success: false, message };
    }
}


export async function migrateSampleDataAction(): Promise<{ success: boolean, message: string }> {
    if (!userId) throw new Error("User not authenticated");

    try {
        await deleteAllDataAction();

        const batch = writeBatch(db);
        const idMap = new Map<string, string>();
        let itemCount = 0;

        // Process items with no dependencies first
        const independentCollections = ['schools', 'divisions', 'seasons', 'fields', 'people'];
        for (const collName of independentCollections) {
            // @ts-ignore
            for (const item of sampleData[collName]) {
                const tempId = item[`${collName.slice(0, -1)}Id`];
                const { [`${collName.slice(0, -1)}Id`]: _, ...itemData } = item;
                
                const dataToSave = { ...itemData, userId };
                if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
                if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));

                const docRef = doc(collection(db, collName));
                batch.set(docRef, dataToSave);
                idMap.set(tempId, docRef.id);
                itemCount++;
            }
        }

        // Process Teams and their Rosters
        for (const team of sampleData.teams) {
            const { teamId: tempTeamId, roster, ...teamData } = team;
            
            const newTeamData = {
                ...teamData,
                schoolId: idMap.get(teamData.schoolId),
                divisionId: idMap.get(teamData.divisionId),
                seasonId: idMap.get(teamData.seasonId),
                schoolName: sampleData.schools.find(s => s.schoolId === teamData.schoolId)?.name,
                divisionName: sampleData.divisions.find(d => d.divisionId === teamData.divisionId)?.name,
                seasonName: sampleData.seasons.find(s => s.seasonId === teamData.seasonId)?.name,
                userId
            };

            const teamDocRef = doc(collection(db, 'teams'));
            batch.set(teamDocRef, newTeamData);
            idMap.set(tempTeamId, teamDocRef.id);
            itemCount++;

            // Process Roster subcollection
            for (const member of roster) {
                const rosterMemberData = {
                    ...member,
                    personId: idMap.get(member.personId)
                };
                const rosterDocRef = doc(collection(db, 'teams', teamDocRef.id, 'roster'));
                batch.set(rosterDocRef, rosterMemberData);
                itemCount++;
            }
        }

        // Process Matches
        for (const match of sampleData.matches) {
            const { matchId: tempMatchId, ...matchData } = match;
            
            const newMatchData = {
                ...matchData,
                teamAId: idMap.get(matchData.teamAId),
                teamBId: idMap.get(matchData.teamBId),
                seasonId: idMap.get(matchData.seasonId),
                fieldId: idMap.get(matchData.fieldId),
                teamAName: sampleData.teams.find(t => t.teamId === matchData.teamAId)?.name,
                teamBName: sampleData.teams.find(t => t.teamId === matchData.teamBId)?.name,
                seasonName: sampleData.seasons.find(s => s.seasonId === matchData.seasonId)?.name,
                fieldName: sampleData.fields.find(f => f.fieldId === matchData.fieldId)?.name,
                dateTime: Timestamp.fromDate(new Date(matchData.dateTime)),
                userId
            };
            const matchDocRef = doc(collection(db, 'matches'));
            batch.set(matchDocRef, newMatchData);
            idMap.set(tempMatchId, matchDocRef.id);
            itemCount++;
        }

        await batch.commit();

        revalidatePath('/', 'layout');

        return { success: true, message: `${itemCount} sample items migrated successfully.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred during migration.";
        console.error("Migration Error:", message);
        return { success: false, message };
    }
}
