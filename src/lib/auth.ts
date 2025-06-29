
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { cache } from 'react';

/**
 * Gets the current user's ID by looking up the admin user by email.
 * This is cached per-request to avoid multiple database calls.
 * @returns The user ID of the admin, or null if not found.
 */
export const getUserId = cache(async (): Promise<string | null> => {
    // In a real application, this would be replaced with actual session management
    // to get the currently logged-in user's ID.
    // For this demo, we reliably find the user designated as the admin in the sample data.
    try {
        const q = query(collection(db, 'people'), where("email", "==", "admin@scrbrd.app"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // This can happen if the data hasn't been migrated yet.
            console.warn("Admin user with email 'admin@scrbrd.app' not found. Have you migrated the sample data?");
            return null;
        }
        
        // Return the ID of the first document found with the admin email.
        return snapshot.docs[0].id;
    } catch (error) {
        console.error("Error fetching admin user ID:", error);
        return null;
    }
});
