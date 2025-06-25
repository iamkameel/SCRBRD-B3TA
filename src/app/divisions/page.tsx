import { getDivisions } from '@/lib/actions/divisions';
import DivisionsClient from './client';

export default async function DivisionsPage() {
  const divisions = await getDivisions();
  return <DivisionsClient divisions={divisions} />;
}
