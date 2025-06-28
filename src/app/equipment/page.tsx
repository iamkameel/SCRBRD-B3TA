
import { getEquipment, getAllEquipmentAssignments } from '@/lib/actions/equipment';
import { getPeopleByRole } from '@/lib/actions/players';
import EquipmentClient from './client';

export default async function EquipmentPage() {
  const [inventory, assignments, players] = await Promise.all([
    getEquipment(),
    getAllEquipmentAssignments(),
    getPeopleByRole('Player'),
  ]);
  
  return <EquipmentClient inventory={inventory} assignments={assignments} players={players} />;
}
