
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { initialTeams, type Team } from '@/lib/data';

// This is a placeholder for a database call to get all teams.
export async function getTeams() {
  // In a real app, you'd fetch this from your database.
  return Promise.resolve(initialTeams);
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

// This is a placeholder for a database insert.
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

  const schoolName = schoolSnap.data().name;
  const divisionName = divisionSnap.data().name;
  const seasonName = seasonSnap.data().name;

  const newTeam: Team = {
    teamId: `team_${new Date().getTime()}`,
    name,
    schoolId,
    schoolName: schoolName,
    divisionId,
    divisionName: divisionName,
    seasonId,
    seasonName: seasonName,
    teamColors: {
      primary: primaryColor,
      secondary: secondaryColor,
    },
  };

  initialTeams.push(newTeam);

  revalidatePath('/teams');

  return { success: true, team: newTeam };
}
