
'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { Person } from '@/lib/data';
import DashboardSkeleton from '@/app/loading';
import { ROLE_GROUPS } from './roles';

const ALL_ROLES = ROLE_GROUPS.flatMap(g => g.roles.map(r => r.id));
const GOD_TIER_EMAIL = 'kameel@maverickdesign.co.za';
const GOD_TIER_UID = '0o2nS9M8g4N2wL4E1bB3t6xYv5Z2'; // Must match the one in server-auth.ts

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
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        if (firebaseUser.email === GOD_TIER_EMAIL) {
            setPerson({
                personId: GOD_TIER_UID,
                firstName: 'Kameel',
                lastName: 'Kalyan',
                displayName: 'System Architect',
                email: GOD_TIER_EMAIL,
                roles: ALL_ROLES,
                activeRole: 'System Architect',
            });
            setLoading(false);
            return;
        }

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
  }, []);

  return (
    <AuthContext.Provider value={{ user, person, loading }}>
      {loading ? <DashboardSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
