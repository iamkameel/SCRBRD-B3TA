import { getVehicles } from '@/lib/actions/transport';
import TransportClient from './client';

export default async function TransportPage() {
  const vehicles = await getVehicles();
  return <TransportClient vehicles={vehicles} />;
}
