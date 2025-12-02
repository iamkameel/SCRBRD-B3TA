
'use client';

import SignupClient from './client';
import { getSchools } from '@/lib/actions/schools';
import { getTeams } from '@/lib/actions/teams';
import { getDivisions } from '@/lib/actions/divisions';
import { getPlayers } from '@/lib/actions/players';
import * as React from 'react';
import type { School, Team, Division, Person } from '@/lib/data';

export default function SignupPage() {
    const [data, setData] = React.useState<{
        schools: School[];
        teams: Team[];
        divisions: Division[];
        players: Person[];
    } | null>(null);

    React.useEffect(() => {
        async function fetchData() {
            const [schools, teams, divisions, players] = await Promise.all([
                getSchools(),
                getTeams(),
                getDivisions(),
                getPlayers(),
            ]);
            const playerList = players.filter(p => p.roles.includes('Player'));
            setData({ schools, teams, divisions, players: playerList });
        }
        fetchData();
    }, []);

    if (!data) {
        // You can return a loading spinner here
        return <div>Loading...</div>;
    }

    return <SignupClient schools={data.schools} teams={data.teams} divisions={data.divisions} players={data.players} />;
}
