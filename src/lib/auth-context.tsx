
'use client';

import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
    // This effect runs when `user` changes.
    // It's only for fetching the profile.
    if (user) {
      setLoading(true); // Start loading when we have a user but no profile yet
      const unsub = onSnapshot(doc(db, 'people', user.uid), (doc) => {
        if (doc.exists()) {
          setPerson({ personId: doc.id, ...doc.data() } as Person);
          setLoading(false); // We have the profile, we're done loading.
        }
        // If the doc doesn't exist yet (e.g., during signup),
        // we intentionally do nothing and keep `loading` as `true`.
        // The `onSnapshot` listener will fire again once the profile document is created,
        // at which point `doc.exists()` will be true and loading will be set to false.
      });
      return () => unsub();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, person, loading }}>
      {loading ? <DashboardSkeleton /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
