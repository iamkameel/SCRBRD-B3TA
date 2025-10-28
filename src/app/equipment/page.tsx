

'use server';

import { getEquipment, getAllEquipmentAssignments } from '@/lib/actions/equipment';
import { getPeopleByRole, getPerson } from '@/lib/actions/players';
import EquipmentClient from './client';
import { getUserId } from '@/lib/firebase-admin';

export default async function EquipmentPage() {
  const [inventory, assignments, players, userId] = await Promise.all([
    getEquipment(),
    getAllEquipmentAssignments(),
    getPeopleByRole('Player'),
    getUserId(),
  ]);
  
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;
  
  return <EquipmentClient inventory={inventory} assignments={assignments} players={players} isAdmin={isAdmin} />;
}
