'use server';

import { revalidatePath } from 'next/cache';
import { deletePlayerAction, getPlayers } from './players';
import { deleteTeamAction, getTeams } from './teams';
import { deleteMatchAction, getMatches } from './matches';
import { deleteSchoolAction, getSchools } from './schools';
import { deleteDivisionAction, getDivisions } from './divisions';
import { deleteSeasonAction, getSeasons } from './seasons';
import { deleteFieldAction, getFields } from './fields';

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
