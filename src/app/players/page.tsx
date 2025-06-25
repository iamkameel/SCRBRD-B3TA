import { getPlayers } from '@/lib/actions/players';
import PlayersClient from './client';

export default async function PlayersPage() {
  const players = await getPlayers();
  return <PlayersClient players={players} />;
}
