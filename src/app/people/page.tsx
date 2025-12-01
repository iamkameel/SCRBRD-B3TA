

'use server';

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/server-auth';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { collection, getDocs, query, where, documentId, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInYears } from 'date-fns';
import type { Person, Team } from '@/lib/data';

export default async function PeoplePage() {
  const [people, userId, schools, teams, divisions] = await Promise.all([
    getPlayers(),
    getUserId(),
    getSchools(),
    getTeams(),
    getDivisions(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

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
    const age = p.dateOfBirth ? differenceInYears(new Date(), new Date(p.dateOfBirth)) : undefined;
    const divisionName = personToDivisionMap.get(p.personId);

    return {
      ...p,
      age,
      divisionName,
    };
  });

  return <PeopleClient people={augmentedPeople} user={user} schools={schools} teams={teams} divisions={divisions} />;
}
