

import { getPlayers, getPerson } from '@/lib/actions/players';
import PeopleClient from './client';
import { getUserId } from '@/lib/auth';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInYears } from 'date-fns';

export default async function PeoplePage() {
  const [people, userId, schools, teams, divisions, rosterSnapshot] = await Promise.all([
    getPlayers(),
    getUserId(),
    getSchools(),
    getTeams(),
    getDivisions(),
    getDocs(collectionGroup(db, 'roster')),
  ]);
  
  const user = userId ? await getPerson(userId) : null;

  const allRosterAssignments = rosterSnapshot.docs.map(doc => ({
    personId: doc.data().personId,
    teamId: doc.ref.parent.parent!.id
  }));

  const teamsMap = new Map(teams.map(t => [t.teamId, t]));

  const augmentedPeople = people.map(p => {
    const assignment = allRosterAssignments.find(a => a.personId === p.personId);
    const team = assignment ? teamsMap.get(assignment.teamId) : undefined;
    const divisionName = team ? team.divisionName : undefined;
    
    const age = p.dateOfBirth ? differenceInYears(new Date(), new Date(p.dateOfBirth)) : undefined;

    return {
      ...p,
      age,
      divisionName,
    };
  });

  return <PeopleClient people={augmentedPeople} user={user} schools={schools} teams={teams} divisions={divisions} />;
}
