'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { initialTeams, initialSchools, initialDivisions, initialSeasons, type Team } from '@/lib/data';

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

  const school = initialSchools.find((s) => s.schoolId === schoolId);
  const division = initialDivisions.find((d) => d.divisionId === divisionId);
  const season = initialSeasons.find((s) => s.seasonId === seasonId);

  if (!school || !division || !season) {
      throw new Error("Invalid selection for school, division, or season.");
  }

  const newTeam: Team = {
    teamId: `team_${new Date().getTime()}`,
    name,
    schoolId,
    schoolName: school.name,
    divisionId,
    divisionName: division.name,
    seasonId,
    seasonName: season.name,
    teamColors: {
      primary: primaryColor,
      secondary: secondaryColor,
    },
  };

  initialTeams.push(newTeam);

  revalidatePath('/teams');

  return { success: true, team: newTeam };
}
