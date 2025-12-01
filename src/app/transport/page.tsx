

'use server';

import { getVehicles, getAllTransportAssignments } from '@/lib/actions/transport';
import { getPeopleByRole, getPerson } from '@/lib/actions/players';
import TransportClient from './client';
import { getUserId } from '@/lib/server-auth';

export default async function TransportPage() {
  const [vehicles, assignments, drivers, userId] = await Promise.all([
    getVehicles(),
    getAllTransportAssignments(),
    getPeopleByRole('Driver'),
    getUserId(),
  ]);

  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster', 'System Architect'].includes(r)) ?? false;

  return <TransportClient vehicles={vehicles} assignments={assignments} drivers={drivers} isAdmin={isAdmin} />;
}
