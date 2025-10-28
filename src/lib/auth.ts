
'use server';

import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from './firebase';
import { cache } from 'react';

export const auth = getAuth(app);

export const getUserId = cache((): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      unsubscribe();
      resolve(user ? user.uid : null);
    }, (error) => {
      reject(error);
    });
  });
});
