
'use server';

import { getUserId as getFirebaseUserId, adminApp } from './firebase-admin';

export const getUserId = getFirebaseUserId;
