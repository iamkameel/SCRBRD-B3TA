
import { getSponsors } from '@/lib/actions/sponsors';
import SponsorsClient from './client';

export default async function SponsorsPage() {
  const sponsors = await getSponsors();
  return <SponsorsClient sponsors={sponsors} />;
}
