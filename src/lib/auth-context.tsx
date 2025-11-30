
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
        // Direct fetch to ensure profile is loaded on initial login or page refresh
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
          // This can happen briefly after signup before the Firestore document is created
          console.warn("User authenticated but no Firestore profile found. Waiting for creation...");
          setPerson(null);
        }
      } else {
        setPerson(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (!user) {
        setPerson(null);
        return;
    }

    // Set up a real-time listener for profile updates after the initial fetch
    const personRef = doc(db, 'people', user.uid);
    const unsubscribeSnapshot = onSnapshot(personRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Spectator'];
            const activeRole = data.activeRole && roles.includes(data.activeRole) 
                ? data.activeRole 
                : roles[0];

            setPerson(prevPerson => {
                const newPerson = { 
                    personId: docSnap.id, 
                    ...data,
                    roles,
                    activeRole,
                    dateOfBirth: data.dateOfBirth?.toDate() 
                } as Person;

                // Avoid unnecessary state updates if the core data hasn't changed.
                if (JSON.stringify(prevPerson) === JSON.stringify(newPerson)) {
                    return prevPerson;
                }
                return newPerson;
            });
        } else {
            setPerson(null);
        }
        setLoading(false); // Ensure loading is false after snapshot updates
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
