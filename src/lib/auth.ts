import { db } from '@/lib/firebase';
import { cache } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function now specifically finds the user with the email 'admin@scrbrd.app'
// to serve as the default user for server-side operations.
// This is a stand-in for a proper session management system.
// NOTE: This means all server actions will run as this admin user,
// regardless of who is logged in through the UI.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    // Find the specific user with the email 'admin@scrbrd.app'.
    const q = query(peopleRef, where('email', '==', 'admin@scrbrd.app'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Return the ID of the specific admin user.
      return snapshot.docs[0].id;
    }
    
    // Fallback if the user is not found
    console.warn("Default admin user 'admin@scrbrd.app' not found in the database.");
    return null;
  } catch (error) {
    console.error("Error fetching admin user ID for 'admin@scrbrd.app':", error);
    return null;
  }
});
