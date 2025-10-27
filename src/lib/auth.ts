
import { cache } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

// This function determines the acting user for server-side rendering and actions.
// It's a stand-in for a proper session management system.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    
    // In a real app, this would get the UID from the session.
    // For this demo, we'll try to find the "god-tier" admin first.
    const godTierQuery = query(peopleRef, where('email', '==', 'kameel@maverickdesign.co.za'), limit(1));
    const godTierSnapshot = await getDocs(godTierQuery);
    if (!godTierSnapshot.empty) {
        return godTierSnapshot.docs[0].id;
    }

    // Fallback 1: Look for any user with the 'Admin' role.
    const adminQuery = query(peopleRef, where('roles', 'array-contains', 'Admin'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);
    if (!adminSnapshot.empty) {
      return adminSnapshot.docs[0].id;
    }
    
    // Fallback 2: If no admin, get the most recently created user.
    const mostRecentUserQuery = query(peopleRef, orderBy('createdAt', 'desc'), limit(1));
    const mostRecentUserSnapshot = await getDocs(mostRecentUserQuery);
     if (!mostRecentUserSnapshot.empty) {
      return mostRecentUserSnapshot.docs[0].id;
    }
    
    console.warn("No users found in the database. Please sign up or migrate sample data to proceed.");
    return null;

  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }
});
