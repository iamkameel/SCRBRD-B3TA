import { getPersonByEmail } from './actions/players';
import { cache } from 'react';

/**
 * Gets the current user's ID.
 * This is cached per-request to avoid multiple database calls.
 * @returns The user ID, or null if not authenticated.
 */
export const getUserId = cache(async (): Promise<string | null> => {
    // For now, we'll fetch the admin user by email for demonstration purposes.
    // This represents the currently logged-in user.
    const adminUser = await getPersonByEmail('admin@scrbrd.app');
    return adminUser?.personId ?? null;
});
