
import AwardsClient from './client';
import { getAwardsData } from '@/lib/actions/awards';

export default async function AwardsPage() {
  const awardsData = await getAwardsData();
  return <AwardsClient initialAwardsData={awardsData} />;
}
