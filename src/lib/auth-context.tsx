

'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Person } from '@/lib/data';
import DashboardSkeleton from '@/app/loading';
import { ROLE_GROUPS } from './roles';

const ALL_ROLES = ROLE_GROUPS.flatMap(g => g.roles.map(r => r.id));

interface AuthContextType {
  user: User | null;
  person: Person | null;
  loading: boolean;
  setPerson: React.Dispatch<React.SetStateAction<Person | null>>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  person: null,
  loading: true,
  setPerson: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [person, setPerson] = React.useState<Person | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const personRef = doc(db, 'people', firebaseUser.uid);
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
            // This case handles a user authenticated with Firebase Auth
            // but without a corresponding 'people' document yet.
            setPerson(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error with profile snapshot listener:", error);
          setPerson(null);
          setLoading(false);
        });
        
        return () => unsubscribeSnapshot();
      } else {
        setPerson(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, person, loading, setPerson }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
