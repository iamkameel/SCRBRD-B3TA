

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, writeBatch, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { sampleData, sampleScorecardData } from '@/lib/sample-data';
import { getPlayers, deletePlayerAction } from './players';
import { getTeams, deleteTeamAction } from './teams';
import { getMatches, deleteMatchAction } from './matches';
import { getSchools, deleteSchoolAction } from './schools';
import { getDivisions, deleteDivisionAction } from './divisions';
import { getSeasons, deleteSeasonAction } from './seasons';
import { getFields, deleteFieldAction } from './fields';
import { getCompetitions, deleteCompetitionAction } from './competitions';
import { getEquipment, deleteEquipmentItemAction } from './equipment';
import { getDrills, deleteDrillAction } from './drills';
import { getUserId } from '@/lib/auth';
import { getSponsors } from './sponsors';
import { getTransactions } from './financials';

const collectionNameMap = {
    'Schools': 'schools', 'Divisions': 'divisions', 'Seasons': 'seasons',
    'Fields': 'fields', 'People': 'people', 'Teams': 'teams', 'Matches': 'matches', 'Competitions': 'competitions',
    'Financials': 'financials', 'Equipment': 'equipment', 'Drills': 'drills', 'Sponsors': 'sponsors',
} as const;
export type SubsetName = keyof typeof collectionNameMap;
const independentSubsets: SubsetName[] = ['Schools', 'Divisions', 'Seasons', 'Fields', 'People', 'Financials', 'Equipment', 'Drills', 'Sponsors'];


export async function deleteAllDataAction(): Promise<{ success: boolean; message: string }> {
    const userId = await getUserId();
    if (!userId) {
        // If there is no admin user, it's very likely there's no data to delete.
        // We can treat this as a success case to unblock other actions.
        return { success: true, message: "No active admin user found, assuming no data to delete." };
    }
    
    try {
        const batch = writeBatch(db);
        let deletedCount = 0;

        const collectionsToClear = [
            'schools', 'divisions', 'seasons', 'fields', 'people', 
            'competitions', 'teams', 'matches', 'vehicles', 'familyLinks', 'financials',
            'equipment', 'equipmentAssignments', 'sponsors', 'sessions', 'drills'
        ];

        for (const collName of collectionsToClear) {
            const q = query(collection(db, collName)); // No user filter needed for admin delete all
            const snapshot = await getDocs(q);
            
            for (const docSnapshot of snapshot.docs) {
                // Handle subcollections before deleting the parent document
                if (collName === 'teams') {
                    const rosterSnapshot = await getDocs(collection(db, docSnapshot.ref.path, 'roster'));
                    rosterSnapshot.forEach(subDoc => { batch.delete(subDoc.ref); deletedCount++; });
                }
                if (collName === 'matches') {
                    const subcollections = ['lineups', 'officials', 'scorecards', 'transportAssignments'];
                    for (const sub of subcollections) {
                         const subSnapshot = await getDocs(collection(db, docSnapshot.ref.path, sub));
                         subSnapshot.forEach(subDoc => { batch.delete(subDoc.ref); deletedCount++; });
                    }
                }
                if (collName === 'fields') {
                    const assignmentsSnapshot = await getDocs(collection(db, docSnapshot.ref.path, 'assignments'));
                    assignmentsSnapshot.forEach(subDoc => { batch.delete(subDoc.ref); deletedCount++; });
                }
                
                // Delete the main document
                batch.delete(docSnapshot.ref);
                deletedCount++;
            }
        }
        
        await batch.commit();

        revalidatePath('/data-management');
        return { success: true, message: "All application data has been deleted." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete all data.";
        console.error("Deletion Error:", message);
        return { success: false, message };
    }
}


export async function migrateSampleDataAction(): Promise<{ success: boolean, message: string }> {
    try {
        // This will clear data for an existing admin or do nothing if the DB is empty.
        await deleteAllDataAction();

        const batch = writeBatch(db);
        const idMap = new Map<string, string>();
        let itemCount = 0;

        // Find the admin user in the sample data to establish the owner ID for this new data set.
        const adminRecord = sampleData.people.find(p => p.personId === 'p_admin');
        if (!adminRecord) {
            throw new Error("Sample data is corrupt: 'p_admin' user not found.");
        }

        // Generate a new, real Firestore ID for the admin user. This will be the owner ID for ALL migrated data.
        const newAdminDocRef = doc(collection(db, 'people'));
        const userId = newAdminDocRef.id;
        
        idMap.set(adminRecord.personId, userId);

        const idKeyMap: { [key: string]: string } = {
            schools: 'schoolId', divisions: 'divisionId', seasons: 'seasonId', fields: 'fieldId',
            people: 'personId', vehicles: 'vehicleId', financials: 'transactionId', equipment: 'itemId',
            sponsors: 'sponsorId', competitions: 'competitionId', drills: 'drillId',
        };

        const collectionsInOrder: (keyof typeof sampleData)[] = [
            'schools', 'divisions', 'seasons', 'people', 'vehicles', 
            'financials', 'equipment', 'sponsors', 'drills'
        ];
        
        for (const collName of collectionsInOrder) {
            for (const item of sampleData[collName as keyof typeof sampleData]) {
                const idKey = idKeyMap[collName as keyof typeof idKeyMap];
                if (!idKey) throw new Error(`No idKey mapping for collection: ${collName}`);
                
                const tempId = (item as any)[idKey as keyof typeof item];

                // If the document is our admin user, we use the pre-generated ref. Otherwise, create a new one.
                const isPredefinedAdmin = collName === 'people' && tempId === adminRecord.personId;
                const docRef = isPredefinedAdmin ? newAdminDocRef : doc(collection(db, collName));

                const { [idKey]: _, ...itemData } = item as any;
                
                const dataToSave: { [key: string]: any } = { ...itemData, userId };
                if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
                if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));
                if (dataToSave.date) dataToSave.date = Timestamp.fromDate(new Date(dataToSave.date));
                if (collName === 'fields' && !dataToSave.status) dataToSave.status = 'Available';

                batch.set(docRef, dataToSave);
                if (tempId && !idMap.has(tempId)) {
                    idMap.set(tempId, docRef.id);
                }
                itemCount++;
            }
        }
        
        // Process Family Links (after people are created)
        if (sampleData.familyLinks) {
            for (const link of sampleData.familyLinks) {
                const { linkId: tempId, ...linkData } = link;
                const newParentId = idMap.get(linkData.parentId);
                const newChildId = idMap.get(linkData.childId);
                
                if (newParentId && newChildId) {
                    const linkDocRef = doc(collection(db, 'familyLinks'));
                    batch.set(linkDocRef, {
                        parentId: newParentId,
                        childId: newChildId,
                        userId
                    });
                    idMap.set(tempId, linkDocRef.id);
                    itemCount++;
                }
            }
        }

        // Process Fields (now that schools exist)
        for (const item of sampleData.fields) {
            const { fieldId: tempId, ...itemData } = item;
            const newFieldData: { [key: string]: any } = { ...itemData, userId };
            if (item.schoolId) {
                const newSchoolId = idMap.get(item.schoolId);
                if (newSchoolId) {
                    newFieldData.schoolId = newSchoolId;
                    newFieldData.schoolName = sampleData.schools.find(s => s.schoolId === item.schoolId)?.name;
                }
            }
             if (!newFieldData.status) newFieldData.status = 'Available';
            const docRef = doc(collection(db, 'fields'));
            batch.set(docRef, newFieldData);
            idMap.set(tempId, docRef.id);
            itemCount++;
        }
        
        // Process Equipment Assignments
        for (const assignment of sampleData.equipmentAssignments) {
            const { assignmentId: tempId, ...assignmentData } = assignment;
            const newAssignmentData = {
                ...assignmentData,
                itemId: idMap.get(assignment.itemId),
                personId: idMap.get(assignment.personId),
                assignedDate: Timestamp.fromDate(new Date(assignment.assignedDate)),
                userId
            };
            const assignmentRef = doc(collection(db, 'equipmentAssignments'));
            batch.set(assignmentRef, newAssignmentData);
            idMap.set(tempId, assignmentRef.id);
            itemCount++;

            // Update the equipment item's status
            const itemRef = doc(db, 'equipment', idMap.get(assignment.itemId)!);
            batch.update(itemRef, { status: 'Assigned', currentAssignmentId: assignmentRef.id, currentHolderId: newAssignmentData.personId, currentHolderName: sampleData.people.find(p => p.personId === assignment.personId)!.firstName + ' ' + sampleData.people.find(p => p.personId === assignment.personId)!.lastName });
        }

        // Process Competitions
        for (const competition of sampleData.competitions) {
            const { competitionId: tempCompId, ...compData } = competition;
            const winnerTeamId = compData.winnerTeamId ? idMap.get(compData.winnerTeamId) : undefined;
            const winnerTeamName = winnerTeamId ? sampleData.teams.find(t => t.teamId === compData.winnerTeamId)?.name : undefined;

            const newCompData: any = {
                ...compData,
                seasonId: idMap.get(compData.seasonId),
                divisionId: idMap.get(compData.divisionId),
                seasonName: sampleData.seasons.find(s => s.seasonId === compData.seasonId)?.name,
                divisionName: sampleData.divisions.find(d => d.divisionId === compData.divisionId)?.name,
                userId
            };

            if (winnerTeamId && winnerTeamName) {
                newCompData.winnerTeamId = winnerTeamId;
                newCompData.winnerTeamName = winnerTeamName;
            }

            const compDocRef = doc(collection(db, 'competitions'));
            batch.set(compDocRef, newCompData);
            idMap.set(tempCompId, compDocRef.id);
            itemCount++;
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

        // Process Field Assignments
        for (const assignment of sampleData.fieldAssignments) {
            const { assignmentId: tempId, ...assignmentData } = assignment;
            const newFieldId = idMap.get(assignment.fieldId);
            const newPersonId = idMap.get(assignment.personId);

            if (newFieldId && newPersonId) {
                const assignmentDocRef = doc(collection(db, 'fields', newFieldId, 'assignments'));
                batch.set(assignmentDocRef, { personId: newPersonId });
                itemCount++;
            }
        }
        
        // Process Matches
        for (const match of sampleData.matches) {
            const { matchId: tempMatchId, competitionId: tempCompId, ...matchData } = match;
            const competition = sampleData.competitions.find(c => c.competitionId === tempCompId);
            if (!competition) continue;

            const scorecardData = sampleScorecardData[tempMatchId as keyof typeof sampleScorecardData];

            const newMatchData: { [key: string]: any } = {
                ...matchData,
                teamAId: idMap.get(matchData.teamAId),
                teamBId: matchData.teamBId ? idMap.get(matchData.teamBId) : '',
                competitionId: idMap.get(tempCompId),
                competitionName: competition.name,
                seasonId: idMap.get(competition.seasonId),
                seasonName: sampleData.seasons.find(s => s.seasonId === competition.seasonId)?.name,
                divisionId: idMap.get(competition.divisionId),
                divisionName: sampleData.divisions.find(d => d.divisionId === competition.divisionId)?.name,
                fieldId: idMap.get(matchData.fieldId),
                teamAName: sampleData.teams.find(t => t.teamId === matchData.teamAId)?.name,
                teamBName: matchData.teamBId ? sampleData.teams.find(t => t.teamId === matchData.teamBId)?.name : 'TBD',
                fieldName: sampleData.fields.find(f => f.fieldId === matchData.fieldId)?.name,
                dateTime: Timestamp.fromDate(new Date(matchData.dateTime)),
                userId,
                playerOfTheMatch: scorecardData ? scorecardData.playerOfTheMatch : null,
                report: '',
                preview: '',
            };

            if (match.round) {
                newMatchData.round = match.round;
            }
             if (match.winnerTeamId) {
                newMatchData.winnerTeamId = idMap.get(match.winnerTeamId);
            }
            if (match.result) {
                newMatchData.result = match.result;
            }

            const matchDocRef = doc(collection(db, 'matches'));
            batch.set(matchDocRef, newMatchData);
            idMap.set(tempMatchId, matchDocRef.id);
            itemCount++;

            if (scorecardData) {
                const innings1Ref = doc(collection(db, matchDocRef.path, 'scorecards'), 'innings1');
                batch.set(innings1Ref, scorecardData.innings1);
                itemCount++;

                const innings2Ref = doc(collection(db, matchDocRef.path, 'scorecards'), 'innings2');
                batch.set(innings2Ref, scorecardData.innings2);
                itemCount++;
            }
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

export async function deleteSubsetAction(subsetName: SubsetName): Promise<{ success: boolean; message: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { success: true, message: "No active user, so no data to delete." };
    }

    try {
        const getAction = {
            'People': getPlayers, 'Teams': getTeams, 'Matches': getMatches, 'Schools': getSchools,
            'Divisions': getDivisions, 'Seasons': getSeasons, 'Fields': getFields, 'Competitions': getCompetitions,
            'Equipment': getEquipment, 'Financials': async () => getDocs(query(collection(db, 'financials'), where("userId", "==", userId))).then(snap => snap.docs.map(d => ({...d.data(), transactionId: d.id}))),
            'Sponsors': async () => getDocs(query(collection(db, 'sponsors'), where("userId", "==", userId))).then(snap => snap.docs.map(d => ({...d.data(), sponsorId: d.id}))),
            'Drills': getDrills,
        }[subsetName];
        
        let deleteAction: ((id: string) => Promise<any>) | undefined;
        if (subsetName === 'People') deleteAction = deletePlayerAction;
        else if (subsetName === 'Teams') deleteAction = deleteTeamAction;
        else if (subsetName === 'Matches') deleteAction = deleteMatchAction;
        else if (subsetName === 'Schools') deleteAction = deleteSchoolAction;
        else if (subsetName === 'Divisions') deleteAction = deleteDivisionAction;
        else if (subsetName === 'Seasons') deleteAction = deleteSeasonAction;
        else if (subsetName === 'Fields') deleteAction = deleteFieldAction;
        else if (subsetName === 'Competitions') deleteAction = deleteCompetitionAction;
        else if (subsetName === 'Equipment') deleteAction = deleteEquipmentItemAction;
        else if (subsetName === 'Drills') deleteAction = deleteDrillAction;
        else if (['Financials', 'Sponsors'].includes(subsetName)) {
            const collName = collectionNameMap[subsetName as 'Financials' | 'Sponsors'];
            deleteAction = (id: string) => deleteDoc(doc(db, collName, id));
        }

        let idKey: string | undefined;
        if (subsetName === 'People') idKey = 'personId';
        else if (subsetName === 'Teams') idKey = 'teamId';
        else if (subsetName === 'Matches') idKey = 'matchId';
        else if (subsetName === 'Schools') idKey = 'schoolId';
        else if (subsetName === 'Divisions') idKey = 'divisionId';
        else if (subsetName === 'Seasons') idKey = 'seasonId';
        else if (subsetName === 'Fields') idKey = 'fieldId';
        else if (subsetName === 'Competitions') idKey = 'competitionId';
        else if (subsetName === 'Equipment') idKey = 'itemId';
        else if (subsetName === 'Drills') idKey = 'drillId';
        else if (subsetName === 'Financials') idKey = 'transactionId';
        else if (subsetName === 'Sponsors') idKey = 'sponsorId';

        if (!getAction || !deleteAction || !idKey) {
            throw new Error(`Invalid subset name for deletion: ${subsetName}`);
        }

        // @ts-ignore
        const items = await getAction();
        for (const item of items) { 
            // @ts-ignore
            await deleteAction(item[idKey]);
        }
        revalidatePath('/data-management');
        return { success: true, message: `All ${subsetName} data has been deleted.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to delete ${subsetName} data.`;
        console.error(message);
        return { success: false, message };
    }
}

export async function migrateSubsetAction(subsetName: SubsetName): Promise<{ success: boolean; message: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { success: false, message: "No admin user found. Please use the 'Migrate All Sample Data' function first to create an admin user." };
    }
    
    if (!independentSubsets.includes(subsetName)) {
        return { success: false, message: `Individual migration for ${subsetName} is not supported due to data dependencies. Please use the full data migration.` };
    }

    try {
        await deleteSubsetAction(subsetName);

        const collectionName = collectionNameMap[subsetName] as keyof typeof sampleData;
        const batch = writeBatch(db);
        let count = 0;
        
        for (const item of sampleData[collectionName as Exclude<keyof typeof sampleData, 'teams' | 'matches' | 'competitions' | 'equipmentAssignments' | 'fieldAssignments' | 'officials' | 'familyLinks'>]) {
            let idKey: string;
            if (subsetName === 'People') idKey = 'personId';
            else if (subsetName === 'Financials') idKey = 'transactionId';
            else if (subsetName === 'Equipment') idKey = 'itemId';
            else if (subsetName === 'Sponsors') idKey = 'sponsorId';
            else if (subsetName === 'Fields') idKey = 'fieldId';
            else if (subsetName === 'Drills') idKey = 'drillId';
            else idKey = `${collectionName.slice(0, -1)}Id`;
            
            const { [idKey]: _, ...itemData } = item as any;
            
            const dataToSave: {[key: string]: any} = { ...itemData, userId };
            if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
            if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));
             if (dataToSave.date) dataToSave.date = Timestamp.fromDate(new Date(dataToSave.date));
            if (collectionName === 'fields' && !dataToSave.status) dataToSave.status = 'Available';


            const docRef = doc(collection(db, collectionName));
            batch.set(docRef, dataToSave);
            count++;
        }
        await batch.commit();
        revalidatePath('/data-management');
        return { success: true, message: `${count} sample ${subsetName} migrated.` };

    } catch (error) {
         const message = error instanceof Error ? error.message : `Failed to migrate ${subsetName} data.`;
        console.error(message);
        return { success: false, message };
    }
}

function toCSV(data: any[]): string {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) {
                value = '';
            } else if (value instanceof Timestamp) {
                value = value.toDate().toISOString();
            } else if (value instanceof Date) {
                value = value.toISOString();
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            
            const stringValue = String(value);

            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}

export async function exportDataAction(subsetName: SubsetName): Promise<{ csv: string; error?: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { csv: '', error: "User not authenticated." };
    }
    
    try {
        let data: any[] = [];
        const getAction = {
            'People': getPlayers, 'Teams': getTeams, 'Matches': getMatches, 'Schools': getSchools,
            'Divisions': getDivisions, 'Seasons': getSeasons, 'Fields': getFields, 'Competitions': getCompetitions,
            'Equipment': getEquipment, 'Financials': getTransactions,
            'Sponsors': getSponsors,
            'Drills': getDrills,
        }[subsetName];

        if (!getAction) {
            throw new Error(`Export not supported for subset: ${subsetName}`);
        }

        // @ts-ignore
        data = await getAction();

        if (data.length === 0) {
             return { csv: '', error: `No data found for ${subsetName} to export.` };
        }
        
        // Remove complex nested objects that don't export well to CSV
        if (subsetName === 'Teams') {
            data = data.map(({ roster, ...team }) => team);
        }
        if (subsetName === 'Matches') {
            data = data.map(({ playerOfTheMatch, liveScore, previousLiveScore, availability, analysisReports, ...match }) => ({
                ...match,
                playerOfTheMatchName: playerOfTheMatch?.name,
                playerOfTheMatchTeam: playerOfTheMatch?.teamName
            }));
        }


        const csv = toCSV(data);
        return { csv };

    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to export ${subsetName} data.`;
        console.error("Export Error:", message);
        return { csv: '', error: message };
    }
}
    




