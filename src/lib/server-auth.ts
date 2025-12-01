
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { adminApp } from './firebase-admin';
import { GOD_TIER_UID } from './data';

export const getUserId = cache(async (): Promise<string | null> => {
    // This is the primary method for development, ensuring the god-tier user is always active.
    return GOD_TIER_UID;
});
