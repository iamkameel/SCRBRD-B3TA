
import { getDivisions } from '@/lib/actions/divisions';
import DivisionsClient from './client';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function DivisionsPage() {
  const divisions = await getDivisions();
  
  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  return <DivisionsClient divisions={divisions} isAdmin={isAdmin} />;
}
