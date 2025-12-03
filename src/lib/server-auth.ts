'use server';

// --- OVERRIDE: Authentication is disabled. ---
// This function now always returns the hardcoded System Architect's user ID
// to ensure all server-side actions are performed with full privileges.

export async function getUserId(): Promise<string> {
  // This is the UID for the hardcoded 'Kameel Kalyan' user.
  // Using this ensures that all server actions, especially data creation,
  // are performed under this administrative user account.
  return "EAycpBbKwRaRI7RALEQkb33eOu63";
};
