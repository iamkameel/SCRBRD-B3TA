
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { Team, RosterMember } from '@/lib/data';
import { getPerson } from './players';

// This user ID will be replaced with dynamic auth state later.
const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

// This function now fetches data from Firestore for the current user
export async function getTeams(): Promise<Team[]> {
  if (!userId) return [];
  try {
    const teamsCollection = collection(db, 'teams');
    const q = query(teamsCollection, where("userId", "==", userId));
    const teamSnapshot = await getDocs(q);
    const teamsList = teamSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            teamId: doc.id,
            name: data.name,
            schoolId: data.schoolId,
            schoolName: data.schoolName,
            divisionId: data.divisionId,
            divisionName: data.divisionName,
            seasonId: data.seasonId,
            seasonName: data.seasonName,
            teamColors: data.teamColors || {},
        }
    });
    return teamsList;
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function getTeam(teamId: string): Promise<Team | null> {
  if (!userId) return null;
  try {
    const teamDocRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamDocRef);

    if (!teamSnap.exists() || teamSnap.data().userId !== userId) {
      return null;
    }
    const data = teamSnap.data();
    return {
      teamId: teamSnap.id,
      name: data.name,
      schoolId: data.schoolId,
      schoolName: data.schoolName,
      divisionId: data.divisionId,
      divisionName: data.divisionName,
      seasonId: data.seasonId,
      seasonName: data.seasonName,
      teamColors: data.teamColors || {},
    } as Team;
  } catch (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return null;
  }
}

export async function getTeamRoster(teamId: string): Promise<RosterMember[]> {
  // Check ownership of the team first
  const team = await getTeam(teamId);
  if (!team) return [];

  try {
    const rosterCol = collection(db, 'teams', teamId, 'roster');
    const rosterSnapshot = await getDocs(rosterCol);

    const rosterPromises = rosterSnapshot.docs.map(async (rosterDoc) => {
        const rosterData = rosterDoc.data();
        // Since we already verified team ownership, we can assume the person is also owned by the user.
        // A more secure implementation might re-verify each person.
        const personSnap = await getDoc(doc(db, 'people', rosterData.personId));

        if (!personSnap.exists()) {
            console.warn(`Person with ID ${rosterData.personId} not found, but is in roster for team ${teamId}`);
            return null;
        }
        const personData = personSnap.data();
        return {
            assignmentId: rosterDoc.id,
            personId: rosterData.personId,
            personName: `${personData.firstName} ${personData.lastName}`,
            role: rosterData.role,
            status: rosterData.status,
            isCaptain: rosterData.isCaptain,
            isViceCaptain: rosterData.isViceCaptain,
        };
    });

    const roster = (await Promise.all(rosterPromises)).filter((m): m is RosterMember => m !== null);
    return roster;
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}


type AssignmentFormValues = {
  personId: string;
  role: string;
  status: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
};

export async function addPlayerToRosterAction(teamId: string, data: AssignmentFormValues) {
  if (!userId) throw new Error("User not authenticated");
  
  // Check ownership of the team
  const team = await getTeam(teamId);
  if (!team) {
    throw new Error("Team not found or you do not have permission to edit it.");
  }
  
  // Check ownership of the person being added
  const person = await getPerson(data.personId);
  if (!person) {
    throw new Error("Person not found or you do not have permission to use them.");
  }

  const assignmentSchema = z.object({
    personId: z.string({ required_error: "Please select a person." }),
    role: z.string({ required_error: "Please select a role." }),
    status: z.string({ required_error: "Please select a status." }),
    isCaptain: z.boolean().default(false),
    isViceCaptain: z.boolean().default(false),
  });

  const validatedFields = assignmentSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid assignment data.');
  }
  
  const { personId, ...rest } = validatedFields.data;

  const rosterCol = collection(db, 'teams', teamId, 'roster');
  
  try {
    await addDoc(rosterCol, {
        personId,
        ...rest
    });
  } catch (error) {
    console.error("Error adding player to roster: ", error);
    throw new Error("Could not add player to roster.");
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}


const teamSchema = z.object({
  name: z.string().min(1, { message: "Team name is required." }),
  schoolId: z.string({ required_error: "Please select a school." }),
  divisionId: z.string({ required_error: "Please select a division." }),
  seasonId: z.string({ required_error: "Please select a season." }),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

// This function now adds a document to Firestore for the current user
export async function addTeamAction(data: TeamFormValues) {
  if (!userId) throw new Error("User not authenticated");
  const validatedFields = teamSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid team data.');
  }
  
  const { name, schoolId, divisionId, seasonId, primaryColor, secondaryColor } = validatedFields.data;

  const schoolDocRef = doc(db, 'schools', schoolId);
  const schoolSnap = await getDoc(schoolDocRef);
  
  const divisionDocRef = doc(db, 'divisions', divisionId);
  const divisionSnap = await getDoc(divisionDocRef);

  const seasonDocRef = doc(db, 'seasons', seasonId);
  const seasonSnap = await getDoc(seasonDocRef);

  if (!schoolSnap.exists() || schoolSnap.data().userId !== userId ||
      !divisionSnap.exists() || divisionSnap.data().userId !== userId ||
      !seasonSnap.exists() || seasonSnap.data().userId !== userId) {
      throw new Error("Invalid selection for school, division, or season. Ensure they belong to you.");
  }

  const newTeamData = {
    name,
    schoolId,
    schoolName: schoolSnap.data().name,
    divisionId,
    divisionName: divisionSnap.data().name,
    seasonId,
    seasonName: seasonSnap.data().name,
    teamColors: {
      primary: primaryColor || '#000000',
      secondary: secondaryColor || '#ffffff',
    },
    userId: userId,
  };
  
  try {
    await addDoc(collection(db, 'teams'), newTeamData);
  } catch (error) {
    console.error("Error adding team: ", error);
    throw new Error("Could not add team.");
  }

  revalidatePath('/teams');

  return { success: true };
}
