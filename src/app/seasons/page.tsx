import { getSeasons } from '@/lib/actions/seasons';
import SeasonsClient from './client';

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  return <SeasonsClient seasons={seasons} />;
}
