
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { deletePlayerAction, getPlayers } from './players';
import { deleteTeamAction, getTeams } from './teams';
import { deleteMatchAction, getMatches } from './matches';
import { deleteSchoolAction, getSchools } from './schools';
import { deleteDivisionAction, getDivisions } from './divisions';
import { deleteSeasonAction, getSeasons } from './seasons';
import { deleteFieldAction, getFields } from './fields';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function deleteDataSubsetAction(subset: string): Promise<{ success: boolean; message: string }> {
    try {
        switch (subset) {
            case 'People':
                const people = await getPlayers();
                for (const person of people) {
                    await deletePlayerAction(person.personId);
                }
                break;
            case 'Teams':
                const teams = await getTeams();
                for (const team of teams) {
                    await deleteTeamAction(team.teamId);
                }
                break;
            case 'Matches':
                const matches = await getMatches();
                for (const match of matches) {
                    await deleteMatchAction(match.matchId);
                }
                break;
            case 'Schools':
                const schools = await getSchools();
                for (const school of schools) {
                    await deleteSchoolAction(school.schoolId);
                }
                break;
            case 'Divisions':
                const divisions = await getDivisions();
                for (const division of divisions) {
                    await deleteDivisionAction(division.divisionId);
                }
                break;
            case 'Seasons':
                const seasons = await getSeasons();
                for (const season of seasons) {
                    await deleteSeasonAction(season.seasonId);
                }
                break;
            case 'Fields':
                const fields = await getFields();
                for (const field of fields) {
                    await deleteFieldAction(field.fieldId);
                }
                break;
            default:
                throw new Error(`Invalid data subset: ${subset}`);
        }

        revalidatePath('/data-management');
        revalidatePath('/'); // Revalidate everything
        return { success: true, message: `All ${subset} data has been deleted.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to delete ${subset} data.`;
        console.error(message);
        return { success: false, message };
    }
}

export async function deleteAllDataAction(): Promise<{ success: boolean; message: string }> {
    try {
        // Order matters for dependencies. Matches depend on teams/players. Teams depend on players/schools etc.
        const subsets = ["Matches", "Teams", "People", "Fields", "Seasons", "Divisions", "Schools"];
        for (const subset of subsets) {
            await deleteDataSubsetAction(subset);
        }
        return { success: true, message: "All application data has been deleted." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete all data.";
        console.error(message);
        return { success: false, message };
    }
}

export async function exportDataSubsetAction(subset: string): Promise<{ success: boolean; message: string; data?: string }> {
    try {
        let dataToExport: any[];
        switch (subset) {
            case 'People':
                dataToExport = await getPlayers();
                break;
            case 'Teams':
                dataToExport = await getTeams();
                break;
            case 'Matches':
                dataToExport = await getMatches();
                break;
            case 'Schools':
                dataToExport = await getSchools();
                break;
            case 'Divisions':
                dataToExport = await getDivisions();
                break;
            case 'Seasons':
                dataToExport = await getSeasons();
                break;
            case 'Fields':
                dataToExport = await getFields();
                break;
            default:
                throw new Error(`Invalid data subset for export: ${subset}`);
        }

        // Convert dates to ISO strings for consistent JSON
        const jsonData = JSON.stringify(dataToExport, (key, value) => {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }, 2);
        
        return { success: true, message: `Exporting ${subset} data.`, data: jsonData };
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to export ${subset} data.`;
        console.error(message);
        return { success: false, message };
    }
}

export async function importDataSubsetAction(subset: string, jsonString: string): Promise<{ success: boolean; message: string }> {
    if (!userId) throw new Error("User not authenticated");
    
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data)) {
            throw new Error("Invalid import file: The root must be a JSON array.");
        }

        const mappings: { [key: string]: { collectionName: string, idKey: string, pagePath: string } } = {
            People: { collectionName: 'people', idKey: 'personId', pagePath: '/players'},
            Schools: { collectionName: 'schools', idKey: 'schoolId', pagePath: '/schools'},
            Divisions: { collectionName: 'divisions', idKey: 'divisionId', pagePath: '/divisions'},
            Seasons: { collectionName: 'seasons', idKey: 'seasonId', pagePath: '/seasons'},
            Fields: { collectionName: 'fields', idKey: 'fieldId', pagePath: '/fields'},
            Teams: { collectionName: 'teams', idKey: 'teamId', pagePath: '/teams'},
            Matches: { collectionName: 'matches', idKey: 'matchId', pagePath: '/matches'},
        };
        const mapping = mappings[subset];
        if (!mapping) {
            throw new Error(`Invalid data subset for import: ${subset}`);
        }
        
        const collectionRef = collection(db, mapping.collectionName);
        let importedCount = 0;

        for (const item of data) {
            // Remove the ID from the imported item to let Firestore generate a new one
            const { [mapping.idKey]: idToRemove, ...itemData } = item;
            
            const dataToSave = { ...itemData, userId };

            // Handle date conversions from ISO string to Firestore Timestamp
            if (subset === 'Seasons') {
                if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
                if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));
            }
            if (subset === 'Matches') {
                if (dataToSave.dateTime) dataToSave.dateTime = Timestamp.fromDate(new Date(dataToSave.dateTime));
            }

            await addDoc(collectionRef, dataToSave);
            importedCount++;
        }

        revalidatePath(mapping.pagePath);
        revalidatePath('/data-management');

        return { success: true, message: `${importedCount} ${subset} item(s) imported successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to import ${subset} data. Check file format.`;
        console.error(message);
        return { success: false, message };
    }
}

export async function exportAllDataAction(): Promise<{ success: boolean; message: string; data?: string }> {
    try {
        const [people, teams, matches, schools, divisions, seasons, fields] = await Promise.all([
            getPlayers(), getTeams(), getMatches(), getSchools(), getDivisions(), getSeasons(), getFields()
        ]);
        
        const allData = { people, teams, matches, schools, divisions, seasons, fields };

        const jsonData = JSON.stringify(allData, (key, value) => {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }, 2);
        
        return { success: true, message: "Exporting all application data.", data: jsonData };
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to export all data.`;
        console.error(message);
        return { success: false, message };
    }
}

export async function importAllDataAction(jsonString: string): Promise<{ success: boolean; message: string }> {
    if (!userId) throw new Error("User not authenticated");

    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            throw new Error("Invalid import file: The file must contain a JSON object with keys for each data type.");
        }

        const importOrder = ['schools', 'divisions', 'seasons', 'fields', 'people', 'teams', 'matches'];
        const idKeyMapping: { [key: string]: string } = {
            people: 'personId', schools: 'schoolId', divisions: 'divisionId', seasons: 'seasonId', 
            fields: 'fieldId', teams: 'teamId', matches: 'matchId',
        };
        let totalImported = 0;

        for (const collectionName of importOrder) {
            if (data[collectionName] && Array.isArray(data[collectionName])) {
                const collectionRef = collection(db, collectionName);
                for (const item of data[collectionName]) {
                    const idKey = idKeyMapping[collectionName];
                    const { [idKey]: idToRemove, ...itemData } = item;
                    const dataToSave = { ...itemData, userId };

                    if (collectionName === 'seasons') {
                        if (dataToSave.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(dataToSave.startDate));
                        if (dataToSave.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(dataToSave.endDate));
                    }
                    if (collectionName === 'matches') {
                        if (dataToSave.dateTime) dataToSave.dateTime = Timestamp.fromDate(new Date(dataToSave.dateTime));
                    }

                    await addDoc(collectionRef, dataToSave);
                    totalImported++;
                }
            }
        }

        revalidatePath('/', 'layout');

        return { success: true, message: `${totalImported} items across all categories were imported successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to import all data. Check file format.";
        console.error(message);
        return { success: false, message };
    }
}
