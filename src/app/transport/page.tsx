
import { getVehicles, getAllTransportAssignments } from '@/lib/actions/transport';
import { getPeopleByRole } from '@/lib/actions/players';
import TransportClient from './client';

export default async function TransportPage() {
  const [vehicles, assignments, drivers] = await Promise.all([
    getVehicles(),
    getAllTransportAssignments(),
    getPeopleByRole('Driver'),
  ]);
  return <TransportClient vehicles={vehicles} assignments={assignments} drivers={drivers} />;
}
