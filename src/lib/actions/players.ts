

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, query, where, writeBatch, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Person, PlayerStats, PlayerTeamAssignment } from '@/lib/data';
import { getScorecard, getMatchLineup } from './matches';
import { generatePlayerPortrait } from '@/ai/flows/generate-player-portrait-flow';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function getPlayers(): Promise<Person[]> {
  if (!userId) return [];
  try {
    const peopleCollection = collection(db, 'people');
    const q = query(peopleCollection, where("userId", "==", userId));
    const peopleSnapshot = await getDocs(q);
    return peopleSnapshot.docs.map(doc => ({
      personId: doc.id, ...doc.data()
    } as Person));
  } catch (error) {
    console.error("Error fetching people:", error);
    return [];
  }
}

export async function getPeopleByRole(role: string): Promise<Person[]> {
  if (!userId) return [];
  try {
    const peopleCollection = collection(db, 'people');
    const q = query(peopleCollection, where("userId", "==", userId), where("roles", "array-contains", role));
    const peopleSnapshot = await getDocs(q);
    return peopleSnapshot.docs.map(doc => ({
      personId: doc.id, ...doc.data()
    } as Person));
  } catch (error) {
    console.error(`Error fetching people with role ${role}:`, error);
    return [];
  }
}

export async function getPerson(personId: string): Promise<Person | null> {
    if (!userId) return null;
    try {
        const personDocRef = doc(db, 'people', personId);
        const personSnap = await getDoc(personDocRef);
        if (!personSnap.exists() || personSnap.data().userId !== userId) return null;
        return { personId: personSnap.id, ...personSnap.data() } as Person;
    } catch (error) {
        console.error(`Error fetching person with ID ${personId}:`, error);
        return null;
    }
}

export async function getPersonByEmail(email: string): Promise<Person | null> {
    if (!userId) return null;
    try {
        const peopleCollection = collection(db, 'people');
        const q = query(peopleCollection, where("userId", "==", userId), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { personId: doc.id, ...doc.data() } as Person;
    } catch (error) {
        console.error(`Error fetching person with email ${email}:`, error);
        return null;
    }
}

export async function getPlayerStats(personId: string): Promise<PlayerStats> {
    const defaultStats: PlayerStats = {
        matchesPlayed: 0, inningsBatted: 0, notOuts: 0, totalRuns: 0, highestScore: 0, highestScoreNotOut: false, ballsFaced: 0, hundreds: 0, fifties: 0, fours: 0, sixes: 0,
        oversBowled: 0, runsConceded: 0, maidens: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0,
        catches: 0, stumpings: 0,
        battingAverage: 0, strikeRate: 0, bowlingAverage: 0, economyRate: 0, bestBowling: "0/0",
    };

    const person = await getPerson(personId);
    if (!person || !person.roles.includes("Player")) {
        return defaultStats;
    }
    const personName = `${person.firstName} ${person.lastName}`;

    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where("userId", "==", userId), where("status", "==", "completed"));
    const completedMatchesSnapshot = await getDocs(q);

    let stats = { ...defaultStats };

    for (const matchDoc of completedMatchesSnapshot.docs) {
        const lineupA = await getMatchLineup(matchDoc.id, matchDoc.data().teamAId);
        const lineupB = await getMatchLineup(matchDoc.id, matchDoc.data().teamBId);
        const playerIsInMatch = [...lineupA, ...lineupB].includes(personId);
        
        if (!playerIsInMatch) continue;

        const scorecard = await getScorecard(matchDoc.id);
        if (!scorecard) continue;

        stats.matchesPlayed++;

        for (const innings of [scorecard.innings1, scorecard.innings2]) {
            const battingEntry = innings.battingCard.find(b => b.name === personName);
            if (battingEntry && battingEntry.balls > 0) { // Only count if they faced a ball
                stats.inningsBatted++;
                stats.totalRuns += battingEntry.runs;
                stats.ballsFaced += battingEntry.balls;
                const isNotOut = battingEntry.status.toLowerCase().includes('not out');
                
                if (battingEntry.runs > stats.highestScore) {
                    stats.highestScore = battingEntry.runs;
                    stats.highestScoreNotOut = isNotOut;
                } else if (battingEntry.runs === stats.highestScore && !stats.highestScoreNotOut && isNotOut) {
                    stats.highestScoreNotOut = true;
                }

                if (isNotOut) {
                    stats.notOuts++;
                }
                if (battingEntry.runs >= 100) stats.hundreds++;
                else if (battingEntry.runs >= 50) stats.fifties++;
                stats.fours += battingEntry.fours;
                stats.sixes += battingEntry.sixes;
            }

            const bowlingEntry = innings.bowlingCard.find(b => b.name === personName);
            if (bowlingEntry) {
                stats.oversBowled += bowlingEntry.overs;
                stats.runsConceded += bowlingEntry.runs;
                stats.maidens += bowlingEntry.maidens;
                stats.wicketsTaken += bowlingEntry.wickets;

                if (stats.bestBowlingWickets === 0 || bowlingEntry.wickets > stats.bestBowlingWickets || (bowlingEntry.wickets === stats.bestBowlingWickets && bowlingEntry.runs < stats.bestBowlingRuns)) {
                    stats.bestBowlingWickets = bowlingEntry.wickets;
                    stats.bestBowlingRuns = bowlingEntry.runs;
                }
            }
        }
    }
    
    const dismissals = stats.inningsBatted - stats.notOuts;
    stats.battingAverage = dismissals > 0 ? stats.totalRuns / dismissals : 0;
    stats.strikeRate = stats.ballsFaced > 0 ? (stats.totalRuns / stats.ballsFaced) * 100 : 0;
    stats.bowlingAverage = stats.wicketsTaken > 0 ? stats.runsConceded / stats.wicketsTaken : 0;
    stats.economyRate = stats.oversBowled > 0 ? stats.runsConceded / stats.oversBowled : 0;
    stats.bestBowling = `${stats.bestBowlingWickets}/${stats.bestBowlingRuns}`;

    return stats;
}


export async function getPersonLinks(personId: string): Promise<{ guardians: Person[], children: Person[] }> {
    if (!userId) return { guardians: [], children: [] };
    if (!await getPerson(personId)) return { guardians: [], children: [] };

    const linksCollection = collection(db, 'familyLinks');
    const guardiansQuery = query(linksCollection, where("childId", "==", personId), where("userId", "==", userId));
    const childrenQuery = query(linksCollection, where("parentId", "==", personId), where("userId", "==", userId));

    try {
        const [guardiansSnapshot, childrenSnapshot] = await Promise.all([getDocs(guardiansQuery), getDocs(childrenQuery)]);
        const guardianIds = guardiansSnapshot.docs.map(doc => doc.data().parentId);
        const childrenIds = childrenSnapshot.docs.map(doc => doc.data().childId);
        
        const guardianPromises = guardianIds.length > 0 ? guardianIds.map(id => getDoc(doc(db, 'people', id))) : [];
        const childrenPromises = childrenIds.length > 0 ? childrenIds.map(id => getDoc(doc(db, 'people', id))) : [];
        
        const guardians = (await Promise.all(guardianPromises)).filter(doc => doc.exists() && doc.data()?.userId === userId).map(doc => ({ personId: doc.id, ...doc.data() } as Person));
        const children = (await Promise.all(childrenPromises)).filter(doc => doc.exists() && doc.data()?.userId === userId).map(doc => ({ personId: doc.id, ...doc.data() } as Person));
        return { guardians, children };
    } catch (error) {
        console.error(`Error fetching links for person ${personId}:`, error);
        return { guardians: [], children: [] };
    }
}

export async function getPersonTeamAssignments(personId: string): Promise<PlayerTeamAssignment[]> {
    if (!userId) return [];
    if (!await getPerson(personId)) return [];

    const assignments: PlayerTeamAssignment[] = [];
    const teamsCollection = collection(db, 'teams');
    const q = query(teamsCollection, where("userId", "==", userId));

    try {
        const teamsSnapshot = await getDocs(q);
        for (const teamDoc of teamsSnapshot.docs) {
            const rosterCol = collection(db, 'teams', teamDoc.id, 'roster');
            const rosterQuery = query(rosterCol, where("personId", "==", personId));
            const rosterSnapshot = await getDocs(rosterQuery);

            if (!rosterSnapshot.empty) {
                const rosterData = rosterSnapshot.docs[0].data();
                assignments.push({
                    teamId: teamDoc.id,
                    teamName: teamDoc.data().name,
                    role: rosterData.role,
                    status: rosterData.status,
                });
            }
        }
    } catch (error) {
        console.error(`Error fetching team assignments for person ${personId}:`, error);
        return [];
    }

    return assignments;
}

const addLinkSchema = z.object({
  currentPersonId: z.string(), linkedPersonId: z.string(), relationship: z.enum(["guardian", "child"]),
});

export async function addPersonLinkAction(currentPersonId: string, linkedPersonId: string, relationship: 'guardian' | 'child') {
  if (!userId) throw new Error("User not authenticated");
  if (!addLinkSchema.safeParse({ currentPersonId, linkedPersonId, relationship }).success) throw new Error('Invalid link data.');
  if (!await getPerson(currentPersonId) || !await getPerson(linkedPersonId)) throw new Error("One or both people could not be found.");

  const { parentId, childId } = relationship === 'guardian' ? { parentId: linkedPersonId, childId: currentPersonId } : { parentId: currentPersonId, childId: linkedPersonId };
  const linksCollection = collection(db, 'familyLinks');
  const q = query(linksCollection, where("parentId", "==", parentId), where("childId", "==", childId), where("userId", "==", userId));
  if (!(await getDocs(q)).empty) throw new Error("This link already exists.");
  
  try {
    await addDoc(linksCollection, { parentId, childId, userId });
  } catch (error) {
    console.error("Error adding family link:", error);
    throw new Error("Could not create the link.");
  }
  revalidatePath(`/players/${currentPersonId}`);
  revalidatePath(`/players/${linkedPersonId}`);
}

const removeLinkSchema = z.object({
  currentPersonId: z.string(), linkedPersonId: z.string(), relationship: z.enum(["guardian", "child"]),
});

export async function removePersonLinkAction(currentPersonId: string, linkedPersonId: string, relationship: 'guardian' | 'child') {
    if (!userId) throw new Error("User not authenticated");
    if (!removeLinkSchema.safeParse({ currentPersonId, linkedPersonId, relationship }).success) throw new Error('Invalid link data.');
    
    // Permission check: ensure both users exist and belong to the current user
    const [currentPerson, linkedPerson] = await Promise.all([getPerson(currentPersonId), getPerson(linkedPersonId)]);
    if (!currentPerson || !linkedPerson) {
        throw new Error("One or both people involved in the link could not be found.");
    }
    
    const { parentId, childId } = relationship === 'guardian' ? { parentId: linkedPersonId, childId: currentPersonId } : { parentId: currentPersonId, childId: linkedPersonId };
    
    const q = query(collection(db, 'familyLinks'), where("parentId", "==", parentId), where("childId", "==", childId), where("userId", "==", userId));
    const linkSnapshot = await getDocs(q);
    if (linkSnapshot.empty) throw new Error("Link not found.");

    try {
        await deleteDoc(linkSnapshot.docs[0].ref);
    } catch (error) {
        console.error("Error removing family link:", error);
        throw new Error("Could not remove link.");
    }
    revalidatePath(`/players/${currentPersonId}`);
    revalidatePath(`/players/${linkedPersonId}`);
}


const playerSchema = z.object({
    firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email(),
    phone: z.string().optional(),
    profileImageUrl: z.string().url().optional().or(z.literal('')),
    roles: z.array(z.string()).min(1),
});
export async function addPlayerAction(data: z.infer<typeof playerSchema>) {
  if (!userId) throw new Error("User not authenticated");
  if (!playerSchema.safeParse(data).success) throw new Error('Invalid person data.');
  try {
    await addDoc(collection(db, 'people'), { ...data, userId });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add person.");
  }
  revalidatePath('/people'); revalidatePath('/teams'); revalidatePath('/new-match');
}

const updatePlayerSchema = playerSchema.extend({ personId: z.string() });
export async function updatePlayerAction(data: z.infer<typeof updatePlayerSchema>) {
  if (!userId) throw new Error("User not authenticated");
  const validated = updatePlayerSchema.safeParse(data);
  if (!validated.success) throw new Error('Invalid person data.');
  const { personId, ...updateData } = validated.data;
  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists() || personSnap.data().userId !== userId) throw new Error("Person not found or you do not have permission.");
  try {
    await updateDoc(personRef, updateData);
  } catch (error) {
    console.error("Error updating person:", error);
    throw new Error("Could not update person.");
  }
  revalidatePath('/people'); revalidatePath(`/people/${personId}`);
  revalidatePath('/settings');
}

export async function deletePlayerAction(personId: string) {
  if (!userId) throw new Error("User not authenticated");
  const personRef = doc(db, 'people', personId);
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists() || personSnap.data().userId !== userId) throw new Error("Person not found or you do not have permission.");
  
  const batch = writeBatch(db);
  
  // 1. Remove from all team rosters that belong to the user
  const teamsQuery = query(collection(db, 'teams'), where("userId", "==", userId));
  const teamsSnapshot = await getDocs(teamsQuery);

  for (const teamDoc of teamsSnapshot.docs) {
      const rosterQuery = query(collection(db, 'teams', teamDoc.id, 'roster'), where("personId", "==", personId));
      const rosterSnapshot = await getDocs(rosterQuery);
      rosterSnapshot.forEach(rosterDoc => {
          batch.delete(rosterDoc.ref);
      });
  }

  // 2. Remove family links
  const parentLinksQuery = query(collection(db, 'familyLinks'), where("parentId", "==", personId), where("userId", "==", userId));
  const childLinksQuery = query(collection(db, 'familyLinks'), where("childId", "==", personId), where("userId", "==", userId));
  const [parentLinks, childLinks] = await Promise.all([getDocs(parentLinksQuery), getDocs(childLinksQuery)]);
  parentLinks.forEach(doc => batch.delete(doc.ref));
  childLinks.forEach(doc => batch.delete(doc.ref));

  // 3. Delete the person document itself
  batch.delete(personRef);

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error deleting person and associated data: ", error);
    throw new Error("Could not delete person.");
  }

  revalidatePath('/people');
  revalidatePath('/teams');
}

export async function generateAndSavePlayerPortraitAction(personId: string) {
    if (!userId) throw new Error("User not authenticated");
    const person = await getPerson(personId);
    if (!person) throw new Error("Person not found or permission denied.");

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

        revalidatePath(`/players/${personId}`);
        revalidatePath('/people');

        return { success: true, message: "AI Portrait generated and saved successfully!" };
    } catch (error) {
        console.error("Error generating portrait:", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate or save portrait.");
    }
}

export async function updateNotificationPreferencesAction(personId: string, preferences: { email?: boolean; push?: boolean }) {
  if (!userId) throw new Error("User not authenticated");
  const personRef = doc(db, 'people', personId);
  
  const personSnap = await getDoc(personRef);
  if (!personSnap.exists() || personSnap.data().userId !== userId) {
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
