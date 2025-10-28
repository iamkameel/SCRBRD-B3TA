
'use client';

import { getAuth } from "firebase/auth";
import { app } from './firebase';

// This is the CLIENT-SIDE auth object.
export const auth = getAuth(app);
