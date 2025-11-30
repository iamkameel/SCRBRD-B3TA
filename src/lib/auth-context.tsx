
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

const tempAdminProfile: Person = {
    personId: 'TEMP_ADMIN',
    firstName: 'Guest',
    lastName: 'Admin',
    email: 'temp@admin.com',
    roles: ['System Architect', 'Admin'],
    activeRole: 'System Architect',
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [person, setPerson] = React.useState<Person | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
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
          console.warn("User authenticated but no Firestore profile found. Applying temporary admin profile.");
          setPerson(tempAdminProfile); // Grant god-tier access if profile is missing
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
            console.warn("Real-time listener could not find user profile. Applying temporary admin profile.");
            setPerson(tempAdminProfile); // Grant god-tier access if profile is missing
        }
    }, (error) => {
      console.error("Error with profile snapshot listener:", error);
      setPerson(tempAdminProfile); // Grant god-tier access on error
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
