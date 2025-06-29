import { db } from '@/lib/firebase';
import { cache } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function now dynamically finds the first admin user in the database
// to serve as the default user for server-side operations.
// This is a stand-in for a proper session management system.
// NOTE: This means all server actions will run as this admin user,
// regardless of who is logged in through the UI.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    // Find a user with the 'Admin' role. We only need one.
    const q = query(peopleRef, where('roles', 'array-contains', 'Admin'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Return the ID of the first admin found.
      return snapshot.docs[0].id;
    }
    
    // Fallback if no admin user is found
    return null;
  } catch (error) {
    console.error("Error fetching admin user ID:", error);
    return null;
  }
});
