
import { cache } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function determines the acting user for server-side rendering and actions.
// It's a stand-in for a proper session management system.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    
    // Prioritize the god-tier admin
    const godTierQuery = query(peopleRef, where('email', '==', 'kameel@maverickdesign.co.za'), limit(1));
    const godTierSnapshot = await getDocs(godTierQuery);
    if (!godTierSnapshot.empty) {
        return godTierSnapshot.docs[0].id;
    }

    // Fallback to the default admin user
    const adminQuery = query(peopleRef, where('email', '==', 'admin@scrbrd.app'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
      return adminSnapshot.docs[0].id;
    }
    
    console.warn("Default admin users not found. This is normal on first launch. Please sign up or migrate sample data to proceed.");
    return null;

  } catch (error) {
    console.error("Error fetching admin user ID:", error);
    return null;
  }
});
