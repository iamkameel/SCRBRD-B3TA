
import { cache } from 'react';
import { getAuth } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// This function is a placeholder for a proper server-side session management system.
// In a real production app, you would get the user's UID from a secure session cookie.
// For this development environment, we will reliably return the ID of the 'god-tier' admin.
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const peopleRef = collection(db, 'people');
    
    // The most reliable way to get our 'god-tier' admin is by their unique email.
    const adminQuery = query(peopleRef, where('email', '==', 'kameel@maverickdesign.co.za'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
      return adminSnapshot.docs[0].id;
    }
    
    // Fallback in case the main admin isn't found, which shouldn't happen with sample data.
    const fallbackAdminQuery = query(peopleRef, where('roles', 'array-contains', 'Admin'), limit(1));
    const fallbackSnapshot = await getDocs(fallbackAdminQuery);
    if (!fallbackSnapshot.empty) {
        return fallbackSnapshot.docs[0].id;
    }

    console.warn("No admin user found. Please ensure 'kameel@maverickdesign.co.za' exists in the 'people' collection or migrate sample data.");
    return null;

  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }
});
