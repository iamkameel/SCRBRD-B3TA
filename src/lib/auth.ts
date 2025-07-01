
import { cache } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function determines the acting user for server-side rendering and actions.
// It's a stand-in for a proper session management system.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    // Find the user with the email 'admin@scrbrd.app'.
    const q = query(peopleRef, where('email', '==', 'admin@scrbrd.app'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Return the ID of the specific admin user.
      return snapshot.docs[0].id;
    }
    
    console.warn("Default admin user 'admin@scrbrd.app' not found. This is normal on first launch. Please sign up or migrate sample data to proceed.");
    return null;

  } catch (error) {
    console.error("Error fetching admin user ID:", error);
    return null;
  }
});
