
'use server';

// --- OVERRIDE: Authentication is disabled. ---
// This function now always returns the hardcoded System Architect's user ID
// to ensure all server-side actions are performed with full privileges.

export async function getUserId(): Promise<string> {
  return "EAycpBbKwRaRI7RALEQkb33eOu63";
};
