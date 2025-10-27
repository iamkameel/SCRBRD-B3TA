
'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { query, collection, where, limit, getDocs, doc, onSnapshot } from 'firebase/firestore';
import type { Person } from '@/lib/data';
import DashboardSkeleton from '@/app/loading';
import { getPerson } from './actions/players';

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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setPerson(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      const personRef = doc(db, "people", user.uid);
      const unsubscribePerson = onSnapshot(personRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Spectator'];
            const activeRole = data.activeRole && roles.includes(data.activeRole) 
                ? data.activeRole 
                : roles[0];

            setPerson({ 
                personId: doc.id, 
                ...data,
                roles,
                activeRole, 
                dateOfBirth: data.dateOfBirth?.toDate() 
            } as Person);
        } else {
            console.warn(`No person document found for UID: ${user.uid}. A new user may need to complete signup or an admin may need to create their profile.`);
            setPerson(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setPerson(null);
        setLoading(false);
      });
      
      return () => unsubscribePerson();

    } else if (!user) {
        setLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, person, loading }}>
      {loading ? <DashboardSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
