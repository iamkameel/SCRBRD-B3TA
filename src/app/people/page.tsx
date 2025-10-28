
'use server';

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/firebase-admin';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInYears } from 'date-fns';

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

  const rosterPromises = teams.map(async (team) => {
      const rosterSnapshot = await getDocs(collection(db, 'teams', team.teamId, 'roster'));
      rosterSnapshot.forEach(doc => {
          const personId = doc.data().personId;
          const divisionName = teamToDivisionMap.get(team.teamId);
          if (personId && divisionName && !personToDivisionMap.has(personId)) {
              personToDivisionMap.set(personId, divisionName);
          }
      });
  });
  await Promise.all(rosterPromises);

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
