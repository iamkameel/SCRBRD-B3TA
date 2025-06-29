
import { db } from '@/lib/firebase';
import { cache } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function determines the acting user for server-side rendering and actions.
// It's a stand-in for a proper session management system.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    // 1. Prioritize finding the specific user with the email 'admin@scrbrd.app'.
    const q = query(peopleRef, where('email', '==', 'admin@scrbrd.app'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Return the ID of the specific admin user.
      return snapshot.docs[0].id;
    }
    
    // 2. Fallback: If the default admin is not found, find the first available admin.
    console.warn("Default admin user 'admin@scrbrd.app' not found. Searching for any admin user.");
    const adminQuery = query(peopleRef, where('roles', 'array-contains', 'Admin'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
        const adminId = adminSnapshot.docs[0].id;
        console.log(`Found fallback admin user with ID: ${adminId}`);
        return adminId;
    }
    
    // 3. If no admins are found at all, warn the developer. This is an expected state on first run.
    console.warn("No admin user found in the database. This is normal on first launch. Please sign up or migrate sample data to proceed.");
    return null;

  } catch (error) {
    console.error("Error fetching admin user ID:", error);
    return null;
  }
});
