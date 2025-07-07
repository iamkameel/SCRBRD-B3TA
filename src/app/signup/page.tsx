
import SignupClient from './client';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { getPlayers } from '@/lib/actions/players';

export default async function SignupPage() {
    const [schools, teams, divisions, players] = await Promise.all([
        getSchools(),
        getTeams(),
        getDivisions(),
        getPlayers(),
    ]);

    // Pass only players for the "link to player" functionality
    const playerList = players.filter(p => p.roles.includes('Player'));

    return <SignupClient schools={schools} teams={teams} divisions={divisions} players={playerList} />;
}
