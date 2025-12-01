

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, app } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, addDoc, doc, getDoc, query, where, writeBatch, deleteDoc, updateDoc, Timestamp, limit, documentId, collectionGroup, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Person, PlayerDevelopmentPlanOutput, Match, PersonSkills, TechnicalSkills, MentalSkills, PhysicalSkills } from '@/lib/data';
import { generatePlayerPortrait } from '@/ai/flows/generate-player-portrait-flow';
import { generatePlayerDevelopmentPlanFlow } from '@/ai/flows/generate-player-development-plan-flow';
import { getPlayerStats, getPlayerMatchHistory } from './stats';
import { SimplifiedPlayerStatsSchema } from '@/ai/schemas';
import { cache } from 'react';
import { getUserId } from '@/lib/server-auth';
import { logAuditEvent } from './audit';
import { GOD_TIER_UID } from '../data';

export async function getPlayers(): Promise<Person[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const currentUser = await getPerson(userId);
  if (!currentUser) return [];

  const peopleCollection = collection(db, 'people');
  
  // Admin sees all people.
  if (currentUser.activeRole === 'Admin' || currentUser.activeRole === 'System Architect') {
      try {
        const peopleSnapshot = await getDocs(peopleCollection);
        return peopleSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                personId: doc.id,
                ...data,
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
            } as Person
        });
      } catch (error) {
        console.error("Error fetching all people for admin:", error);
        return [];
      }
  }

  // Sportsmaster sees people from their assigned schools.
  if (currentUser.activeRole === 'Sportsmaster') {
      if (!currentUser.assignedSchools || currentUser.assignedSchools.length === 0) {
          return [];
      }
      
      try {
        const peopleIds = new Set<string>();

        // 1. Get people directly assigned to the schools (staff)
        const staffQuery = query(peopleCollection, where('assignedSchools', 'array-contains-any', currentUser.assignedSchools));
        const staffSnapshot = await getDocs(staffQuery);
        staffSnapshot.forEach(doc => {
            peopleIds.add(doc.id);
        });
        
        // 2. Get teams for the sportsmaster's schools
        const teamsQuery = query(collection(db, 'teams'), where("schoolId", "in", currentUser.assignedSchools));
        const teamsSnapshot = await getDocs(teamsQuery);
        const accessibleTeamIds = new Set(teamsSnapshot.docs.map(doc => doc.id));

        if (accessibleTeamIds.size > 0) {
            // 3. Use a single collectionGroup query to find all relevant roster members efficiently
            const rosterGroupQuery = query(collectionGroup(db, 'roster'));
            const allRosterMembersSnapshot = await getDocs(rosterGroupQuery);

            // 4. Filter roster members in memory to find players from accessible teams
            allRosterMembersSnapshot.forEach(rosterDoc => {
                const teamId = rosterDoc.ref.parent.parent?.id;
                if (teamId && accessibleTeamIds.has(teamId)) {
                    peopleIds.add(rosterDoc.data().personId);
                }
            });
        }
        
        // 5. Fetch all unique people documents in chunks
        if (peopleIds.size === 0) {
            return [];
        }

        const personIdChunks: string[][] = [];
        const allPersonIds = Array.from(peopleIds);
        for (let i = 0; i < allPersonIds.length; i += 30) {
            personIdChunks.push(allPersonIds.slice(i, i + 30));
        }

        const people: Person[] = [];
        for (const chunk of personIdChunks) {
            if (chunk.length === 0) continue;
            const peopleQuery = query(peopleCollection, where(documentId(), 'in', chunk));
            const peopleSnapshot = await getDocs(peopleQuery);
            peopleSnapshot.forEach(doc => {
                 const data = doc.data();
                people.push({ 
                    personId: doc.id, 
                    ...data,
                    dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
                } as Person);
            });
        }
        return people;

      } catch (error) {
        console.error("Error fetching people for sportsmaster:", error);
        return [];
      }
  }
  
  // Default behavior for other roles: fetch all people.
  try {
    const peopleSnapshot = await getDocs(peopleCollection);
    return peopleSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            personId: doc.id,
            ...data,
            dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
        } as Person
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return [];
  }
}

export async function getPeopleByRole(role: string): Promise<Person[]> {
  try {
    const peopleCollection = collection(db, 'people');
    const q = query(peopleCollection, where("roles", "array-contains", role));
    const peopleSnapshot = await getDocs(q);
    return peopleSnapshot.docs.map(doc => ({
      personId: doc.id, ...doc.data()
    } as Person));
  } catch (error) {
    console.error("Error fetching people with role " + role + ":", error);
    return [];
  }
}

export const getPerson = cache(async (personId: string): Promise<Person | null> => {
    if (!personId) return null;
    try {
        const personDocRef = doc(db, 'people', personId);
        const personSnap = await getDoc(personDocRef);
        if (!personSnap.exists()) {
            return null;
        }

        const data = personSnap.data();
        const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Spectator'];
        const activeRole = data.activeRole && roles.includes(data.activeRole) 
            ? data.activeRole 
            : roles[0];

        return {
            personId: personSnap.id,
            ...data,
            dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
            activeRole
        } as Person;

    } catch (error) {
        console.error('Error fetching person with ID ${personId}:', error);
        return null;
    }
});

export const getPersonByEmail = cache(async (email: string): Promise<Person | null> => {
    try {
        const peopleCollection = collection(db, 'people');
        const q = query(peopleCollection, where("email", "==", email), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return { 
            personId: docSnap.id, 
            ...data,
            dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
        } as Person;
    } catch (e) {
        console.error("Error fetching person by email", e);
        return null;
    }
});

export async function getPersonLinks(personId: string): Promise<{ guardians: Person[], children: Person[] }> {
    if (!await getPerson(personId)) return { guardians: [], children: [] };

    const linksCollection = collection(db, 'familyLinks');
    const guardiansQuery = query(linksCollection, where("childId", "==", personId));
    const childrenQuery = query(linksCollection, where("parentId", "==", personId));

    try {
        const [guardiansSnapshot, childrenSnapshot] = await Promise.all([getDocs(guardiansQuery), getDocs(childrenQuery)]);
        const guardianIds = guardiansSnapshot.docs.map(doc => doc.data().parentId);
        const childrenIds = childrenSnapshot.docs.map(doc => doc.data().childId);
        
        const guardianPromises = guardianIds.length > 0 ? guardianIds.map(id => getDoc(doc(db, 'people', id))) : [];
        const childrenPromises = childrenIds.length > 0 ? childrenIds.map(id => getDoc(doc(db, 'people', id))) : [];
        
        const guardians = (await Promise.all(guardianPromises)).filter(doc => doc.exists()).map(doc => ({ personId: doc.id, ...doc.data() } as Person));
        const children = (await Promise.all(childrenPromises)).filter(doc => doc.exists()).map(doc => ({ personId: doc.id, ...doc.data() } as Person));
        return { guardians, children };
    } catch (error) {
        console.error('Error fetching links for person ${personId}:', error);
        return { guardians: [], children: [] };
    }
}

const addLinkSchema = z.object({
  currentPersonId: z.string(), linkedPersonId: z.string(), relationship: z.enum(["guardian", "child"]),
});

export async function addPersonLinkAction(currentPersonId: string, linkedPersonId: string, relationship: 'guardian' | 'child') {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated.");

  if (!addLinkSchema.safeParse({ currentPersonId, linkedPersonId, relationship }).success) throw new Error('Invalid link data.');
  if (!await getPerson(currentPersonId) || !await getPerson(linkedPersonId)) throw new Error("One or both people could not be found.");

  const { parentId, childId } = relationship === 'guardian' ? { parentId: linkedPersonId, childId: currentPersonId } : { parentId: currentPersonId, childId: linkedPersonId };
  const linksCollection = collection(db, 'familyLinks');
  const q = query(linksCollection, where("parentId", "==", parentId), where("childId", "==", childId));
  if (!(await getDocs(q)).empty) throw new Error("This link already exists.");
  
  try {
    await addDoc(linksCollection, { parentId, childId, userId });
  } catch (error) {
    console.error("Error adding family link:", error);
    throw new Error("Could not create the link.");
  }
  revalidatePath(`/people/${currentPersonId}`);
  revalidatePath(`/people/${linkedPersonId}`);
}

const removeLinkSchema = z.object({
  currentPersonId: z.string(), linkedPersonId: z.string(), relationship: z.enum(["guardian", "child"]),
});

export async function removePersonLinkAction(currentPersonId: string, linkedPersonId: string, relationship: 'guardian' | 'child') {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");
    if (!removeLinkSchema.safeParse({ currentPersonId, linkedPersonId, relationship }).success) throw new Error('Invalid link data.');
    
    const [currentPerson, linkedPerson] = await Promise.all([getPerson(currentPersonId), getPerson(linkedPersonId)]);
    if (!currentPerson || !linkedPerson) {
        throw new Error("One or both people involved in the link could not be found.");
    }
    
    const { parentId, childId } = relationship === 'guardian' ? { parentId: linkedPersonId, childId: currentPersonId } : { parentId: currentPersonId, childId: linkedPersonId };
    
    const q = query(collection(db, 'familyLinks'), where("parentId", "==", parentId), where("childId", "==", childId));
    const linkSnapshot = await getDocs(q);
    if (linkSnapshot.empty) throw new Error("Link not found.");

    try {
        await deleteDoc(linkSnapshot.docs[0].ref);
    } catch (error) {
        console.error("Error removing family link:", error);
        throw new Error("Could not remove link.");
    }
    revalidatePath(`/people/${currentPersonId}`);
    revalidatePath(`/people/${linkedPersonId}`);
}

const personObjectSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  displayName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  profileImageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  assignedSchoolId: z.string().optional(),
  activeRole: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  physicalAttributes: z.object({
    heightCm: z.coerce.number().optional(),
    weightKg: z.coerce.number().optional(),
    battingHand: z.enum(['Left', 'Right']).optional(),
    bowlingHand: z.enum(['Left', 'Right']).optional(),
    bowlingStyles: z.array(z.string()).optional(),
  }).optional(),
  biography: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
});

const refinePersonSchema = (schema: z.AnyZodObject) => schema.refine(data => {
    if (data.roles && data.roles.length > 0 && !data.activeRole) {
        return false;
    }
    if (data.activeRole && !data.roles.includes(data.activeRole)) {
        return false;
    }
    return true;
}, {
    message: "An active role must be selected from the assigned roles.",
    path: ["activeRole"],
});

const personSchema = refinePersonSchema(personObjectSchema);

type PersonFormValues = z.infer<typeof personSchema>;

function hasPermissionToAssign(assigner: Person, targetRoles: string[], originalTargetRoles: string[] = []): boolean {
    const assignerRoles = new Set(assigner.roles);

    if (assignerRoles.has('System Architect')) {
        return true;
    }
    if (assignerRoles.has('Admin')) {
        const isTryingToModifyArchitect = targetRoles.includes('System Architect') || originalTargetRoles.includes('System Architect');
        return !isTryingToModifyArchitect;
    }

    const isTryingToGrantAdmin = targetRoles.some(r => (r === 'Admin' || r === 'System Architect') && !originalTargetRoles.includes(r));
    const isTryingToRevokeAdmin = originalTargetRoles.some(r => (r === 'Admin' || r === 'System Architect') && !targetRoles.includes(r));

    if (isTryingToGrantAdmin || isTryingToRevokeAdmin) {
        return false;
    }
    
    const permissions: { [key: string]: string[] } = {
        'Sportsmaster': ['School Admin', 'Umpire', 'Scorer'],
        'School Admin': ['Coach', 'Assistant Coach', 'Trainer', 'Physiotherapist', 'Doctor', 'Chiropractor', 'Nutritionist', 'First Aid', 'Grounds-Keeper', 'Driver', 'Player', 'Guardian', 'Spectator', 'Team Manager', 'Captain', 'Vice-Captain'],
        'Coach': ['Assistant Coach', 'Captain', 'Player']
    };

    const allowedToAssign = new Set<string>();
    assigner.roles.forEach(role => {
        const allowed = permissions[role as keyof typeof permissions];
        if (allowed) {
            allowed.forEach(p => allowedToAssign.add(p));
        }
    });

    const newRoles = targetRoles.filter(r => !originalTargetRoles.includes(r));
    return newRoles.every(target => allowedToAssign.has(target));
}

export async function addPlayerAction(data: z.infer<typeof personSchema>) {
  const validated = personSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid person data.');
  
  const currentUserId = await getUserId();
  if (!currentUserId) throw new Error("You must be logged in to perform this action.");
  
  const currentUser = await getPerson(currentUserId);
  if (!currentUser) throw new Error("Could not verify your identity.");

  if (!hasPermissionToAssign(currentUser, data.roles)) {
    throw new Error("You do not have permission to assign one or more of the selected roles.");
  }
  
  const { assignedSchoolId, ...restOfData } = validated.data;

  try {
    const docRef = await addDoc(collection(db, 'people'), { 
      ...restOfData,
      dateOfBirth: restOfData.dateOfBirth ? Timestamp.fromDate(restOfData.dateOfBirth) : null,
      assignedSchools: assignedSchoolId ? [assignedSchoolId] : [],
      notificationPreferences: { email: true, push: false },
    });

    await logAuditEvent({
        action: 'person.create',
        target: { type: 'Person', id: docRef.id, name: `${restOfData.firstName} ${restOfData.lastName}` },
        details: { roles: restOfData.roles }
    });

  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add person.");
  }
  revalidatePath('/people'); revalidatePath('/teams'); revalidatePath('/new-match');
}

const updatePlayerSchema = refinePersonSchema(
    personObjectSchema.extend({ personId: z.string() })
);
export async function updatePlayerAction(data: z.infer<typeof updatePlayerSchema>) {
  const validated = updatePlayerSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid person data.');

  const currentUserId = await getUserId();
  if (!currentUserId) throw new Error("You must be logged in to perform this action.");
  
  const currentUser = await getPerson(currentUserId);
  if (!currentUser) throw new Error("Could not verify your identity.");
  
  const { personId, assignedSchoolId, ...updateData } = validated.data;
  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists()) throw new Error("Person not found or you do not have permission.");
  
  const originalRoles = personSnap.data().roles || [];
  const newRoles = updateData.roles;

  if (!hasPermissionToAssign(currentUser, newRoles, originalRoles)) {
      throw new Error("You do not have permission to assign or remove one or more of the selected roles.");
  }

  const updatePayload: {[key: string]: any} = {
    ...updateData,
    dateOfBirth: updateData.dateOfBirth ? Timestamp.fromDate(updateData.dateOfBirth) : null,
    assignedSchools: assignedSchoolId ? [assignedSchoolId] : []
  };

  try {
    await updateDoc(personRef, updatePayload);
    await logAuditEvent({
        action: 'person.update',
        target: { type: 'Person', id: personId, name: `${updateData.firstName} ${updateData.lastName}` },
        details: { updatedFields: Object.keys(updateData) }
    });

  } catch (error) {
    console.error("Error updating person:", error);
    throw new Error("Could not update person.");
  }
  revalidatePath('/people'); revalidatePath(`/people/${personId}`);
  revalidatePath('/settings');
}

export async function deletePlayerAction(personId: string) {
  const currentUserId = await getUserId();
  const currentUser = currentUserId ? await getPerson(currentUserId) : null;
  if (!currentUser || !(currentUser.roles.includes('Admin') || currentUser.roles.includes('System Architect'))) {
    throw new Error("Only administrators can delete people.");
  }
  
  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists()) throw new Error("Person not found or you do not have permission.");

  const personData = personSnap.data();
  const personName = `${personData.firstName} ${personData.lastName}`;
  
  const batch = writeBatch(db);
  
  // 1. Remove from all team rosters
  const teamsQuery = query(collection(db, 'teams'));
  const teamsSnapshot = await getDocs(teamsQuery);

  for (const teamDoc of teamsSnapshot.docs) {
      const rosterQuery = query(collection(db, 'teams', teamDoc.id, 'roster'), where("personId", "==", personId));
      const rosterSnapshot = await getDocs(rosterQuery);
      rosterSnapshot.forEach(rosterDoc => {
          batch.delete(rosterDoc.ref);
      });
  }

  // 2. Remove family links
  const parentLinksQuery = query(collection(db, 'familyLinks'), where("parentId", "==", personId));
  const childLinksQuery = query(collection(db, 'familyLinks'), where("childId", "==", personId));
  const [parentLinks, childLinks] = await Promise.all([getDocs(parentLinksQuery), getDocs(childLinksQuery)]);
  parentLinks.forEach(doc => batch.delete(doc.ref));
  childLinks.forEach(doc => batch.delete(doc.ref));

  // 3. Delete the person document itself
  batch.delete(personRef);

  try {
    await batch.commit();
    await logAuditEvent({
        action: 'person.delete',
        target: { type: 'Person', id: personId, name: personName },
    });
  } catch (error) {
    console.error("Error deleting person and associated data: ", error);
    throw new Error("Could not delete person.");
  }

  revalidatePath('/people');
  revalidatePath('/teams');
}

export async function generateAndSavePlayerPortraitAction(personId: string) {
    const [person, currentUserId] = await Promise.all([getPerson(personId), getUserId()]);
    if (!person) throw new Error("Person not found or permission denied.");

    const currentUser = currentUserId ? await getPerson(currentUserId) : null;
    const canManage = currentUser?.roles.includes('Admin') || false;

    if (currentUserId !== personId && !canManage) {
        throw new Error("You do not have permission to generate a portrait for this user.");
    }

    try {
        const { imageUrl } = await generatePlayerPortrait({
            firstName: person.firstName,
            lastName: person.lastName,
        });

        if (!imageUrl) {
            throw new Error("AI failed to generate a portrait.");
        }

        const personRef = doc(db, 'people', personId);
        await updateDoc(personRef, { profileImageUrl: imageUrl });

        revalidatePath(`/people/${personId}`);
        revalidatePath('/people');

        return { success: true, message: "AI Portrait generated and saved successfully!" };
    } catch (error) {
        console.error("Error generating portrait:", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate or save portrait.");
    }
}

export async function updateNotificationPreferencesAction(personId: string, preferences: { email?: boolean; push?: boolean }) {
  const personRef = doc(db, 'people', personId);
  
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists()) {
    throw new Error("Person not found or you do not have permission.");
  }
  
  const updates: { [key: string]: boolean } = {};
  if (preferences.email !== undefined) {
    updates['notificationPreferences.email'] = preferences.email;
  }
  if (preferences.push !== undefined) {
    updates['notificationPreferences.push'] = preferences.push;
  }
  
  if (Object.keys(updates).length === 0) {
    return;
  }

  try {
    await updateDoc(personRef, updates);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw new Error("Could not update notification preferences.");
  }

  revalidatePath('/settings');
}

export async function saveFcmTokenAction(token: string) {
    const userId = await getUserId();
    if (!userId || !token) return;

    const personRef = doc(db, 'people', userId);
    try {
        await updateDoc(personRef, {
            fcmTokens: arrayUnion(token)
        });
    } catch (error) {
        console.error("Error saving FCM token:", error);
        throw new Error("Could not save notification token.");
    }
}

export async function removeFcmTokenAction(token: string) {
    const userId = await getUserId();
    if (!userId || !token) return;

    const personRef = doc(db, 'people', userId);
    try {
        await updateDoc(personRef, {
            fcmTokens: arrayRemove(token)
        });
    } catch (error) {
        console.error("Error removing FCM token:", error);
        throw new Error("Could not remove notification token.");
    }
}


export async function generatePlayerDevelopmentPlanAction(personId: string): Promise<PlayerDevelopmentPlanOutput> {
    const person = await getPerson(personId);
    if (!person) {
        throw new Error('Player not found.');
    }

    const [stats, history] = await Promise.all([
        getPlayerStats(personId),
        getPlayerMatchHistory(personId)
    ]);
    
    const simplifiedStats: z.infer<typeof SimplifiedPlayerStatsSchema> = {
        matchesPlayed: stats.matchesPlayed,
        totalRuns: stats.totalRuns,
        battingAverage: parseFloat(stats.battingAverage.toFixed(2)),
        strikeRate: parseFloat(stats.strikeRate.toFixed(2)),
        wicketsTaken: stats.wicketsTaken,
        bowlingAverage: parseFloat(stats.bowlingAverage.toFixed(2)),
        economyRate: parseFloat(stats.economyRate.toFixed(2)),
    };

    const recentPerformances = history.map(h => ({
        opponent: h.opponent,
        runs: h.runsScored ?? 0,
    }));
    
    const promptInput = {
        playerName: `${person.firstName} ${person.lastName}`,
        playerStats: simplifiedStats,
        recentPerformances,
    };

    try {
        const plan = await generatePlayerDevelopmentPlanFlow(promptInput);
        
        const personRef = doc(db, 'people', personId);
        await updateDoc(personRef, {
            developmentPlan: plan,
            developmentPlanGeneratedAt: Timestamp.now(),
        });
        revalidatePath(`/people/${personId}`);

        return plan;
    } catch (error) {
        console.error("Error generating development plan:", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate development plan.");
    }
}

export async function updateActiveRoleAction(personId: string, role: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated.");
  }
  if (personId !== userId) {
      throw new Error("You can only change your own active role.");
  }
  
  if (personId === GOD_TIER_UID) {
    // This is a virtual user, no DB update is needed. The client-side state is handled optimistically.
    return;
  }
  
  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  
  if (!personSnap.exists()) {
    throw new Error("Person not found or you do not have permission.");
  }

  const personData = personSnap.data() as Person;
  if (!personData.roles.includes(role)) {
    throw new Error("Cannot switch to a role the user does not have.");
  }

  try {
    await updateDoc(personRef, { activeRole: role });
  } catch (error) {
    console.error("Error updating active role:", error);
    throw new Error("Could not update active role.");
  }
}

export async function getSchoolStaff(schoolId: string): Promise<Person[]> {
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
    console.error('Error fetching staff for school ${schoolId}:', error);
    return [];
  }
}


export async function assignPersonToSchoolAction(personId: string, schoolId: string | null) {
  const currentUserId = await getUserId();
  if (!currentUserId) throw new Error("You must be logged in to perform this action.");

  const currentUser = await getPerson(currentUserId);
  const permittedRoles = ['Admin', 'Sportsmaster', 'Team Manager', 'System Architect'];
  if (!currentUser || !currentUser.roles.some(role => permittedRoles.includes(role))) {
      throw new Error("You do not have permission to perform this action.");
  }

  if (!personId) {
      throw new Error("Invalid data provided for assignment.");
  }

  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists()) {
    throw new Error("Person not found.");
  }

  try {
    await updateDoc(personRef, {
        assignedSchools: schoolId ? [schoolId] : []
    });
  } catch (error) {
    console.error("Error updating school assignment:", error);
    throw new Error("Could not update school assignment.");
  }

  revalidatePath('/people');
  revalidatePath(`/people/${personId}`);
}

const skillDetailSchema = z.object({}).catchall(z.number().min(1).max(20));

const skillsSchema = z.object({
  technical: z.object({
    batting: skillDetailSchema.optional(),
    bowling: skillDetailSchema.optional(),
    fielding: skillDetailSchema.optional(),
  }),
  mental: skillDetailSchema,
  physical: skillDetailSchema,
});
export async function updatePlayerSkillsAction(personId: string, skills: PersonSkills) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const person = await getPerson(userId);
    if (!person || (!person.roles.includes('Admin') && !person.roles.includes('Coach'))) {
        throw new Error("You do not have permission to edit player skills.");
    }
    
    const validatedSkills = skillsSchema.safeParse(skills);
    if (!validatedSkills.success) {
        console.error(validatedSkills.error.errors);
        throw new Error("Invalid skills data provided.");
    }

    try {
        const personRef = doc(db, 'people', personId);
        await updateDoc(personRef, { skills: validatedSkills.data });
        revalidatePath(`/people/${personId}`);
    } catch (error) {
        console.error("Error updating player skills:", error);
        throw new Error("Could not update player skills.");
    }
}
