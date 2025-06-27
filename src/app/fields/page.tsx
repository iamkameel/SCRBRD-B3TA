
import { getFields } from '@/lib/actions/fields';
import { getPeopleByRole } from '@/lib/actions/players';
import FieldsClient from './client';

export default async function FieldsPage() {
  const [fields, groundskeepers] = await Promise.all([
    getFields(),
    getPeopleByRole('Grounds-Keeper'),
  ]);
  
  return <FieldsClient fields={fields} groundskeepers={groundspeople} />;
}
