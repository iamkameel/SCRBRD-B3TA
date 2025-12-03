
'use server';

import { getAllPeople, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/server-auth';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { collection, getDocs, query, where, documentId, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInYears } from 'date-fns';
import type { Person, Team } from '@/lib/data';

// Helper function to serialize date objects
const serializePerson = (person: Person): Person => {
    return {
        ...person,
        // Convert Date objects to ISO strings, which are serializable
        dateOfBirth: person.dateOfBirth ? person.dateOfBirth.toISOString() as any : undefined,
        developmentPlanGeneratedAt: person.developmentPlanGeneratedAt ? person.developmentPlanGeneratedAt.toISOString() as any : undefined,
    };
};

export default async function PeoplePage() {
  const [people, userId, schools, teams, divisions] = await Promise.all([
    getAllPeople(),
    getUserId(),
    getSchools(),
    getTeams(),
    getDivisions(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const canManage = user?.roles.some(r => ['Admin', 'Sportsmaster', 'Team Manager', 'System Architect'].includes(r)) ?? false;
  const canEditUsers = user?.roles.includes('Admin') || user?.roles.includes('System Architect') || false;

  const teamToDivisionMap = new Map<string, string>();
  teams.forEach(team => {
    if(team.divisionName) {
      teamToDivisionMap.set(team.teamId, team.divisionName);
    }
  });

  const personToDivisionMap = new Map<string, string>();

  // Efficiently fetch all roster assignments.
  const rosterGroupQuery = query(collectionGroup(db, 'roster'));
  const rosterGroupSnapshot = await getDocs(rosterGroupQuery);

  const teamIdsFromRoster = new Set<string>();
  rosterGroupSnapshot.forEach(doc => {
      const teamId = doc.ref.parent.parent?.id;
      if (teamId) teamIdsFromRoster.add(teamId);
  });
  
  // Fetch details for only the teams that have roster members.
  const teamInfoMap = new Map<string, Team>();
  if (teamIdsFromRoster.size > 0) {
      const teamIdChunks: string[][] = [];
      const allTeamIds = Array.from(teamIdsFromRoster);
      for (let i = 0; i < allTeamIds.length; i += 30) {
          teamIdChunks.push(allTeamIds.slice(i, i + 30));
      }

      for (const chunk of teamIdChunks) {
          if (chunk.length === 0) continue;
          const teamsQuery = query(collection(db, 'teams'), where(documentId(), 'in', chunk));
          const teamsSnapshot = await getDocs(teamsQuery);
          teamsSnapshot.forEach(doc => {
              teamInfoMap.set(doc.id, doc.data() as Team);
          });
      }
  }

  rosterGroupSnapshot.forEach(doc => {
      const personId = doc.data().personId;
      const teamId = doc.ref.parent.parent?.id;
      if (personId && teamId) {
          const team = teamInfoMap.get(teamId);
          if (team && team.divisionName) {
            personToDivisionMap.set(personId, team.divisionName);
          }
      }
  });


  const augmentedPeople = people.map(p => {
    const age = p.dateOfBirth ? differenceInYears(new Date(), p.dateOfBirth) : undefined;
    const divisionName = personToDivisionMap.get(p.personId);

    return {
      ...p,
      age,
      divisionName,
    };
  });
  
  // Serialize the user objects to make them safe to pass to a Client Component
  const serializablePeople = augmentedPeople.map(serializePerson);
  const serializableCurrentUser = user ? serializePerson(user) : null;

  return <PeopleClient people={serializablePeople} user={serializableCurrentUser} schools={schools} teams={teams} divisions={divisions} canManage={canManage} canEditUsers={canEditUsers} />;
}
