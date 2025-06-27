
import { getPlayers } from '@/lib/actions/players';
import PeopleClient from './client';

export default async function PeoplePage() {
  const people = await getPlayers();
  return <PeopleClient people={people} />;
}
