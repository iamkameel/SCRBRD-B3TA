
import { getDrills } from '@/lib/actions/drills';
import DrillsClient from './client';

export default async function DrillsPage() {
  const drills = await getDrills();
  return <DrillsClient initialDrills={drills} />;
}
