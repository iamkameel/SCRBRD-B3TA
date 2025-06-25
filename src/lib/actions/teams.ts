
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import type { Team } from '@/lib/data';

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
