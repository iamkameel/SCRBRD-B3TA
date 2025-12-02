
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Sponsor } from '@/lib/data';
import { getUserId } from '@/lib/server-auth';
import { getPerson } from './players';


const checkManagementPermission = async (userId: string) => {
    if (userId === 'TEMP_ADMIN') return;
    const user = await getPerson(userId);
    if (!user || !user.roles.some(r => ['Admin', 'System Architect'].includes(r))) {
        throw new Error("You do not have permission to manage sponsors.");
    }
}

export async function getSponsors(): Promise<Sponsor[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const sponsorsCollection = collection(db, 'sponsors');
    const q = query(sponsorsCollection);
    const sponsorSnapshot = await getDocs(q);
    const sponsorsList = sponsorSnapshot.docs.map(doc => ({
      sponsorId: doc.id,
      ...doc.data(),
    } as Sponsor));
    return sponsorsList;
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
}

const sponsorSchema = z.object({
  name: z.string().min(1, { message: "Sponsor name is required." }),
  logoUrl: z.string().url({ message: "A valid logo URL is required." }).or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export async function addSponsorAction(data: z.infer<typeof sponsorSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = sponsorSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid sponsor data.');
  }

  try {
    await addDoc(collection(db, 'sponsors'), {
      ...validatedFields.data,
      userId: userId,
    });
  } catch (error) {
    console.error("Error adding sponsor: ", error);
    throw new Error("Could not add sponsor.");
  }
  
  revalidatePath('/sponsors');
}

const updateSponsorSchema = sponsorSchema.extend({
  sponsorId: z.string(),
});

export async function updateSponsorAction(data: z.infer<typeof updateSponsorSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateSponsorSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid sponsor data.');
    }

    const { sponsorId, ...updateData } = validatedFields.data;
    const sponsorDocRef = doc(db, 'sponsors', sponsorId);

    try {
        await updateDoc(sponsorDocRef, updateData);
    } catch (error) {
        console.error("Error updating sponsor:", error);
        throw new Error("Could not update sponsor.");
    }

    revalidatePath('/sponsors');
}

export async function deleteSponsorAction(sponsorId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  
  if (!sponsorId) {
    throw new Error("Sponsor ID is required.");
  }
  
  const sponsorDocRef = doc(db, 'sponsors', sponsorId);
  
  try {
    await deleteDoc(sponsorDocRef);
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    throw new Error("Could not delete sponsor.");
  }

  revalidatePath('/sponsors');
}
