
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import type { Team, RosterMember } from '@/lib/data';

// This function now fetches data from Firestore
export async function getTeams(): Promise<Team[]> {
  try {
    const teamsCollection = collection(db, 'teams');
    const teamSnapshot = await getDocs(teamsCollection);
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
  try {
    const teamDocRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamDocRef);

    if (!teamSnap.exists()) {
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
  try {
    const rosterCol = collection(db, 'teams', teamId, 'roster');
    const rosterSnapshot = await getDocs(rosterCol);

    const rosterPromises = rosterSnapshot.docs.map(async (rosterDoc) => {
        const rosterData = rosterDoc.data();
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

  // Check if person exists
  const personDocRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personDocRef);
  if (!personSnap.exists()) {
      throw new Error("Selected person does not exist.");
  }

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

// This function now adds a document to Firestore
export async function addTeamAction(data: TeamFormValues) {
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

  if (!schoolSnap.exists() || !divisionSnap.exists() || !seasonSnap.exists()) {
      throw new Error("Invalid selection for school, division, or season.");
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
