'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { query, collection, where, limit, getDocs } from 'firebase/firestore';
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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // If the user logs out, we can stop loading immediately.
      if (!firebaseUser) {
        setPerson(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
      const fetchPerson = async () => {
        setLoading(true);
        const q = query(collection(db, "people"), where("email", "==", user.email), limit(1));
        try {
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            setPerson({ personId: userDoc.id, ...userDoc.data() } as Person);
          } else {
            // This can happen if a user is created in Auth but not yet in Firestore,
            // or if they were deleted from Firestore but not Auth.
            setPerson(null);
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setPerson(null);
        }
        finally {
          setLoading(false);
        }
      };
      
      fetchPerson();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, person, loading }}>
      {loading ? <DashboardSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
