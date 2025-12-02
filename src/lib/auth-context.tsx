'use client';

import * as React from 'react';
import type { User } from 'firebase/auth';
import type { Person } from '@/lib/data';

// --- OVERRIDE: Authentication is disabled. ---
// This context now provides a mock System Architect user by default.
// This allows full access to the application for development and testing
// without needing to go through a login flow.

const MOCK_USER_ID = "EAycpBbKwRaRI7RALEQkb33eOu63";

const mockPerson: Person = {
  personId: MOCK_USER_ID,
  firstName: "Kameel",
  lastName: "Kalyan",
  displayName: "Kameel",
  email: "kameel@maverickdesign.co.za",
  roles: ["System Architect", "Admin", "Sportsmaster", "School Admin", "Coach", "Assistant Coach", "Team Manager", "Captain", "Player", "Guardian", "Spectator", "Trainer", "Physiotherapist", "Doctor", "First Aid", "Umpire", "Scorer", "Grounds-Keeper", "Driver"],
  activeRole: 'System Architect',
  assignedSchools: [],
  notificationPreferences: { email: true, push: false },
  userId: MOCK_USER_ID,
};

const mockUser = {
  uid: MOCK_USER_ID,
  email: "kameel@maverickdesign.co.za",
  displayName: "Kameel Kalyan",
} as User;


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
  const [person, setPerson] = React.useState<Person | null>(mockPerson);

  const value = {
    user: mockUser,
    person,
    loading: false, // Never show loading, user is always "logged in"
    setPerson,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
