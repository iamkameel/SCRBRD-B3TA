

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, writeBatch, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { sampleData, sampleScorecardData } from '@/lib/sample-data';
import { getPlayers, deletePlayerAction, getPersonByEmail } from './players';
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
import type { Person } from '../data';

const collectionNameMap = {
    'Schools': 'schools', 'Divisions': 'divisions', 'Seasons': 'seasons',
    'Fields': 'fields', 'People': 'people', 'Teams': 'teams', 'Matches': 'matches', 'Competitions': 'competitions',
    'Financials': 'financials', 'Equipment': 'equipment', 'Drills': 'drills', 'Sponsors': 'sponsors',
} as const;
export type SubsetName = keyof typeof collectionNameMap;
const independentSubsets: SubsetName[] = ['Schools', 'Divisions', 'Seasons', 'Fields', 'People', 'Financials', 'Equipment', 'Drills', 'Sponsors'];


export async function deleteAllDataAction(): Promise<{ success: boolean; message: string }> {
    try {
        const batch = writeBatch(db);
        let deletedCount = 0;

        // Get all Admins first to protect them.
        const godTierEmails = ['kameel@maverickdesign.co.za', 'admin@scrbrd.app'];
        const adminQuery = query(collection(db, 'people'), where('email', 'in', godTierEmails));
        const adminSnapshot = await getDocs(adminQuery);
        const adminIds = new Set(adminSnapshot.docs.map(d => d.id));

        const collectionsToClear = [
            'schools', 'divisions', 'seasons', 'fields', 'people', 
            'competitions', 'teams', 'matches', 'vehicles', 'familyLinks', 'financials',
            'equipment', 'equipmentAssignments', 'sponsors', 'sessions', 'drills', 'assignmentRequests'
        ];

        for (const collName of collectionsToClear) {
            const q = query(collection(db, collName));
            const snapshot = await getDocs(q);
            
            for (const docSnapshot of snapshot.docs) {
                // If the collection is 'people', check if the person is an admin before deleting.
                if (collName === 'people' && adminIds.has(docSnapshot.id)) {
                    continue; // Skip deleting admin users.
                }

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
                
                batch.delete(docSnapshot.ref);
                deletedCount++;
            }
        }
        
        await batch.commit();

        revalidatePath('/data-management');
        return { success: true, message: "All non-admin application data has been deleted." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete all data.";
        console.error("Deletion Error:", message);
        return { success: false, message };
    }
}


export async function migrateSampleDataAction(): Promise<{ success: boolean, message: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { success: false, message: "Admin user not found. Please ensure an admin account exists or sign up before migrating data." };
    }

    try {
        await deleteAllDataAction();

        const batch = writeBatch(db);
        const idMap = new Map<string, string>();
        let itemCount = 0;

        const existingAdminsByEmail = new Map<string, string>();
        const adminQuery = query(collection(db, 'people'), where('roles', 'array-contains', 'Admin'));
        const adminSnapshot = await getDocs(adminQuery);
        adminSnapshot.forEach(doc => {
            existingAdminsByEmail.set(doc.data().email, doc.id);
        });

        sampleData.people.forEach(person => {
            if (person.roles.includes('Admin') && existingAdminsByEmail.has(person.email)) {
                idMap.set(person.personId, existingAdminsByEmail.get(person.email)!);
            }
        });

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

                if (collName === 'people' && (item as Person).roles.includes('Admin') && existingAdminsByEmail.has((item as Person).email)) {
                    continue; 
                }
                
                const { [idKey]: _, ...itemData } = item as any;
                
                const dataToSave: { [key: string]: any } = { ...itemData, userId };
                if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
                if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));
                if (dataToSave.date) dataToSave.date = Timestamp.fromDate(new Date(dataToSave.date));
                if (collName === 'fields' && !dataToSave.status) dataToSave.status = 'Available';

                const docRef = doc(collection(db, collName));
                batch.set(docRef, dataToSave);
                if (tempId) {
                    idMap.set(tempId, docRef.id);
                }
                itemCount++;
            }
        }
        
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
            
            const itemRef = doc(db, 'equipment', idMap.get(assignment.itemId)!);
            batch.update(itemRef, { status: 'Assigned', currentAssignmentId: assignmentRef.id, currentHolderId: newAssignmentData.personId, currentHolderName: sampleData.people.find(p => p.personId === assignment.personId)!.firstName + ' ' + sampleData.people.find(p => p.personId === assignment.personId)!.lastName });
        }

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
                teamIds: compData.teamIds ? compData.teamIds.map(id => idMap.get(id)) : [],
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
                lineupConfirmedByCaptainA: false,
                lineupConfirmedByCaptainB: false,
            };

            if (match.round) newMatchData.round = match.round;
            if (match.winnerTeamId) newMatchData.winnerTeamId = idMap.get(match.winnerTeamId);
            if (match.result) newMatchData.result = match.result;

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
        return { success: false, message: `Migration failed. Please check server logs. Error: ${message}` };
    }
}

export async function deleteSubsetAction(subsetName: SubsetName): Promise<{ success: boolean; message: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { success: true, message: "No active user, so no data to delete." };
    }

    if (!independentSubsets.includes(subsetName)) {
        return { success: false, message: `Individual deletion for ${subsetName} is not supported due to data dependencies. Please use the 'Delete All Data' function.` };
    }
    try {
        const getAction = {
            'People': getPlayers, 'Teams': getTeams, 'Matches': getMatches, 'Schools': getSchools,
            'Divisions': getDivisions, 'Seasons': getSeasons, 'Fields': getFields, 'Competitions': getCompetitions,
            'Equipment': getEquipment, 'Financials': getTransactions,
            'Sponsors': getSponsors,
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

export async function exportDataAction(subsetName: SubsetName): Promise<{ csv?: string; error?: string }> {
    const userId = await getUserId();
    if (!userId) {
        return { error: "User not authenticated." };
    }

    try {
        const collectionName = collectionNameMap[subsetName];
        const q = query(collection(db, collectionName), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { csv: "" };
        }

        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const headers = Object.keys(data[0]);
        const replacer = (key: string, value: any) => value === null ? '' : value;
        const csvRows = data.map(row =>
            headers.map(fieldName => {
                let value = (row as any)[fieldName];
                if (value instanceof Timestamp) {
                    value = value.toDate().toISOString();
                } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                return JSON.stringify(value, replacer);
            }).join(',')
        );

        const csv = [headers.join(','), ...csvRows].join('\r\n');
        return { csv };

    } catch (error) {
        console.error(`Error exporting ${subsetName}:`, error);
        return { error: `Failed to export ${subsetName} data.` };
    }
}

    