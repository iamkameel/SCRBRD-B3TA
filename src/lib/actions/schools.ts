

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, app } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, documentId, writeBatch, Timestamp } from 'firebase/firestore';
import type { School, Person, Team, Match } from '@/lib/data';
import { cache } from 'react';
import { getUserId } from '@/lib/auth';
import { getPerson } from './players';
import { getPersonTeamAssignments, getTeams, getTeamsBySchool } from './teams';

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to manage schools.");
    }
}

export async function getSchools(): Promise<School[]> {
  const userId = await getUserId();
  if (!userId) return [];
  
  const currentUser = await getPerson(userId);
  if (!currentUser) return [];

  const schoolsCollection = collection(db, 'schools');
  let q;

  const activeRole = currentUser.activeRole;

  if (activeRole === 'Admin') {
    q = query(schoolsCollection);
  } else if (activeRole === 'Sportsmaster' && currentUser.assignedSchools && currentUser.assignedSchools.length > 0) {
    q = query(schoolsCollection, where(documentId(), 'in', currentUser.assignedSchools));
  } else if (['Coach', 'Player', 'Team Manager'].includes(activeRole)) {
      const assignments = await getPersonTeamAssignments(userId);
      
      // If the user has specific team assignments, only return those schools.
      if (assignments.length > 0) {
        const schoolIds = [...new Set(assignments.map(a => allTeams.find(t => t.teamId === a.teamId)?.schoolId).filter(Boolean))];
        if (schoolIds.length > 0) {
            q = query(schoolsCollection, where(documentId(), 'in', schoolIds));
        } else {
            return []; // No schools to show if their teams aren't linked to schools
        }
      } else if (currentUser.assignedSchools && currentUser.assignedSchools.length > 0) { // If no teams, but they are a school admin/staff, show those schools
        q = query(schoolsCollection, where(documentId(), 'in', currentUser.assignedSchools));
    } else { // If no assignments at all, show all schools so they can make a request
        q = query(schoolsCollection);
    }
  } else {
    // Default for other roles (spectators, etc.) is to see all schools
    q = query(schoolsCollection);
  }

  try {
    const schoolSnapshot = await getDocs(q);
    const schoolsList = schoolSnapshot.docs.map(doc => ({
      schoolId: doc.id,
      ...doc.data(),
    } as School));
    return schoolsList;
  } catch (error) {
    console.error("Error fetching schools:", error);
    return [];
  }
}

export const getSchool = cache(async (schoolId: string): Promise<School | null> => {
  try {
    const schoolDocRef = doc(db, 'schools', schoolId);
    const schoolSnap = await getDoc(schoolDocRef);
    if (!schoolSnap.exists()) {
      return null;
    }
    return {
      schoolId: schoolSnap.id,
      ...schoolSnap.data(),
    } as School;
  } catch (error) {
    console.error(`Error fetching school with ID ${schoolId}:`, error);
    return null;
  }
});


const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
  abbreviation: z.string().optional(),
  motto: z.string().optional(),
  establishmentYear: z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional().or(z.literal('')),
  principal: z.string().optional(),
  socialMedia: z.object({
    facebook: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    twitter: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    youtube: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  }).optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  logoDataUri: z.string().optional(),
  website: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
});


type SchoolFormValues = z.infer<typeof schoolSchema>;

// This function now adds a document to Firestore associated with the current user
export async function addSchoolAction(data: SchoolFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);

  const validatedFields = schoolSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid school name.');
  }
  
  const { logoDataUri, ...schoolData } = validatedFields.data;
  
  let finalLogoUrl = schoolData.logoUrl || '';

  if (logoDataUri) {
    const storage = getStorage(app);
    const storageRef = ref(storage, `logos/schools/${schoolData.name.replace(/\s+/g, '-')}-${Date.now()}.png`);
    const mimeType = logoDataUri.match(/data:(.*);/)?.[1] || 'image/png';
    const base64Data = logoDataUri.split(',')[1];
    
    await uploadString(storageRef, base64Data, 'base64', { contentType: mimeType });
    finalLogoUrl = await getDownloadURL(storageRef);
  }


  try {
    await addDoc(collection(db, 'schools'), {
      ...schoolData,
      logoUrl: finalLogoUrl,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add school.");
  }
  
  revalidatePath('/schools');
  revalidatePath('/teams'); // Also revalidate teams page as it uses schools
  
  return { success: true };
}


const updateSchoolSchema = schoolSchema.extend({
  schoolId: z.string(),
});

export async function updateSchoolAction(data: z.infer<typeof updateSchoolSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateSchoolSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid school data.');
    }
    
    const { schoolId, logoDataUri, ...updateData } = validatedFields.data;
    const schoolDocRef = doc(db, 'schools', schoolId);

    const schoolSnap = await getDoc(schoolDocRef);
    if (!schoolSnap.exists()) {
        throw new Error("School not found or you do not have permission to edit it.");
    }
    
    let finalLogoUrl = updateData.logoUrl || '';

    if (logoDataUri) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `logos/schools/${updateData.name.replace(/\s+/g, '-')}-${Date.now()}.png`);
        const mimeType = logoDataUri.match(/data:(.*);/)?.[1] || 'image/png';
        const base64Data = logoDataUri.split(',')[1];
        
        await uploadString(storageRef, base64Data, 'base64', { contentType: mimeType });
        finalLogoUrl = await getDownloadURL(storageRef);
    }
    
    const finalUpdateData = { ...updateData, logoUrl: finalLogoUrl };

    try {
        await updateDoc(schoolDocRef, finalUpdateData as { [key: string]: any });
    } catch (error) {
        console.error("Error updating school:", error);
        throw new Error("Could not update school.");
    }

    revalidatePath('/schools');
    revalidatePath(`/schools/${schoolId}`);
    revalidatePath('/teams');
}

export async function deleteSchoolAction(schoolId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
  if (!schoolId) {
    throw new Error("School ID is required.");
  }
  
  const schoolDocRef = doc(db, 'schools', schoolId);

  const schoolSnap = await getDoc(schoolDocRef);
  if (!schoolSnap.exists()) {
    throw new Error("School not found or you do not have permission to delete it.");
  }
  
  try {
    await deleteDoc(schoolDocRef);
  } catch (error) {
    console.error("Error deleting school:", error);
    throw new Error("Could not delete school.");
  }

  revalidatePath('/schools');
  revalidatePath('/teams');
}

export async function getSchoolStaff(schoolId: string): Promise<Person[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const peopleCollection = collection(db, 'people');
    const q = query(peopleCollection, where("assignedSchools", "array-contains", schoolId));
    const staffSnapshot = await getDocs(q);
    const staffList = staffSnapshot.docs.map(doc => ({
      personId: doc.id,
      ...doc.data()
    } as Person));
    return staffList;
  } catch (error) {
    console.error(`Error fetching staff for school ${schoolId}:`, error);
    return [];
  }
}


export async function getSchoolPlayers(schoolId: string): Promise<Person[]> {
    const teams = await getTeamsBySchool(schoolId);
    const playerIds = new Set<string>();
    for (const team of teams) {
        const roster = await getTeamRoster(team.teamId);
        for (const member of roster) {
            if (member.role === 'Player') {
                playerIds.add(member.personId);
            }
        }
    }
    
    if (playerIds.size === 0) return [];

    const people: Person[] = [];
    const personIdChunks: string[][] = [];
    const allPersonIds = Array.from(playerIds);
    for (let i = 0; i < allPersonIds.length; i += 30) {
        personIdChunks.push(allPersonIds.slice(i, i + 30));
    }

    for (const chunk of personIdChunks) {
        if (chunk.length === 0) continue;
        const peopleQuery = query(collection(db, 'people'), where(documentId(), 'in', chunk));
        const peopleSnapshot = await getDocs(peopleQuery);
        peopleSnapshot.forEach(doc => {
            people.push({ personId: doc.id, ...doc.data() } as Person);
        });
    }
    return people;
}

export async function updateSchoolStaffAssignmentsAction(schoolId: string, staffIdsToAssign: string[]) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    await checkManagementPermission(userId);

    const batch = writeBatch(db);
    const peopleCollection = collection(db, 'people');
    
    // Get all staff currently assigned to this school
    const currentStaffSnap = await getDocs(query(peopleCollection, where("assignedSchools", "array-contains", schoolId)));
    const currentStaffIds = new Set(currentStaffSnap.docs.map(doc => doc.id));
    const newStaffIds = new Set(staffIdsToAssign);

    // Determine who to add and who to remove
    const toAdd = staffIdsToAssign.filter(id => !currentStaffIds.has(id));
    const toRemove = currentStaffSnap.docs.filter(doc => !newStaffIds.has(doc.id));

    // Add new assignments
    for (const personId of toAdd) {
        const personRef = doc(peopleCollection, personId);
        const personSnap = await getDoc(personRef);
        if (personSnap.exists()) {
            const currentSchools = personSnap.data().assignedSchools || [];
            batch.update(personRef, { assignedSchools: [...new Set([...currentSchools, schoolId])] });
        }
    }

    // Remove old assignments
    for (const personDoc of toRemove) {
        const personRef = personDoc.ref;
        const currentSchools = personDoc.data().assignedSchools || [];
        batch.update(personRef, { assignedSchools: currentSchools.filter((id: string) => id !== schoolId) });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error bulk updating staff assignments:", error);
        throw new Error("Could not update staff assignments.");
    }
    
    revalidatePath(`/schools/${schoolId}`);
}

export async function getMatchesBySchool(schoolId: string): Promise<Match[]> {
  const teams = await getTeamsBySchool(schoolId);
  if (teams.length === 0) return [];

  const teamIds = teams.map(t => t.teamId);
  
  const matchesCollection = collection(db, 'matches');
  // Firestore 'in' query has a limit of 30 items. If a school has more teams, this needs chunking.
  // For this app's scale, we assume it's under 30.
  const teamAQuery = query(matchesCollection, where("teamAId", "in", teamIds));
  const teamBQuery = query(matchesCollection, where("teamBId", "in", teamIds));

  const [teamAMatchesSnap, teamBMatchesSnap] = await Promise.all([
    getDocs(teamAQuery),
    getDocs(teamBQuery),
  ]);

  const allMatches = [...teamAMatchesSnap.docs, ...teamBMatchesSnap.docs];
  const uniqueMatchesMap = new Map<string, Match>();

  const allTeams = await getTeams(); // Fetch all teams to get opponent logos
  const teamInfoMap = new Map<string, Team>();
  allTeams.forEach(team => teamInfoMap.set(team.teamId, team));

  allMatches.forEach(doc => {
      const data = doc.data();
      const teamA = teamInfoMap.get(data.teamAId);
      const teamB = teamInfoMap.get(data.teamBId);
      
      uniqueMatchesMap.set(doc.id, {
        matchId: doc.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate(),
        teamALogoUrl: teamA?.logoUrl,
        teamBLogoUrl: teamB?.logoUrl,
      } as Match);
  });

  return Array.from(uniqueMatchesMap.values()).sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());
}
