
'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { Person } from '@/lib/data';
import DashboardSkeleton from '@/app/loading';

interface AuthContextType {
  user: User | null;
  person: Person | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  person: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [person, setPerson] = React.useState<Person | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Use a direct fetch to ensure the profile is loaded on initial auth state change.
        // This is more reliable on first load than relying solely on the snapshot listener.
        const personRef = doc(db, 'people', firebaseUser.uid);
        const personSnap = await getDoc(personRef);
        if (personSnap.exists()) {
          const data = personSnap.data();
          const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Spectator'];
          const activeRole = data.activeRole && roles.includes(data.activeRole) 
                ? data.activeRole 
                : roles[0];
          setPerson({
            personId: personSnap.id,
            ...data,
            roles,
            activeRole,
            dateOfBirth: data.dateOfBirth?.toDate()
          } as Person);
        } else {
          // This can happen briefly after signup or if the profile document is missing.
          // The snapshot listener below will pick it up if it gets created.
          console.warn("User authenticated but no Firestore profile found on initial load.");
          setPerson(null);
        }
      } else {
        setPerson(null);
      }
      // Set loading to false only after the initial user and person state are determined.
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (!user) {
        // If the user logs out, we don't need to do anything else.
        // The onAuthStateChanged handler has already set the user and person to null.
        return;
    }

    // Set up a real-time listener for profile updates after the initial fetch.
    // This handles role changes or profile updates made in other browser tabs.
    const personRef = doc(db, 'people', user.uid);
    const unsubscribeSnapshot = onSnapshot(personRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Spectator'];
            const activeRole = data.activeRole && roles.includes(data.activeRole) 
                ? data.activeRole 
                : roles[0];

            setPerson({ 
                personId: docSnap.id, 
                ...data,
                roles,
                activeRole,
                dateOfBirth: data.dateOfBirth?.toDate() 
            } as Person);
        } else {
            console.warn("Real-time listener could not find user profile. They may have been deleted.");
            setPerson(null);
        }
    }, (error) => {
      console.error("Error with profile snapshot listener:", error);
      setPerson(null);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, person, loading }}>
      {loading ? <DashboardSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
