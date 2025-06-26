
import { getVehicles, getAllTransportAssignments } from '@/lib/actions/transport';
import TransportClient from './client';

export default async function TransportPage() {
  const [vehicles, assignments] = await Promise.all([
    getVehicles(),
    getAllTransportAssignments(),
  ]);
  return <TransportClient vehicles={vehicles} assignments={assignments} />;
}
