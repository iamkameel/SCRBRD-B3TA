
'use client';

import * as React from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import type { Person } from '@/lib/data';
import { app } from '@/lib/firebase';
import { getPerson } from '@/lib/actions/players';
import DashboardSkeleton from '@/app/loading';

const auth = getAuth(app);

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const personProfile = await getPerson(user.uid);
        setPerson(personProfile);
      } else {
        setUser(null);
        setPerson(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    person,
    loading,
    setPerson,
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
