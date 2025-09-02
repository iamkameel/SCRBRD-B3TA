
import { getFields } from '@/lib/actions/fields';
import { getSchools } from '@/lib/actions/schools';
import { getPeopleByRole } from '@/lib/actions/players';
import FieldsClient from './client';

export default async function FieldsPage() {
  const [fields, schools, groundkeepers] = await Promise.all([
    getFields(),
    getSchools(),
    getPeopleByRole('Grounds-Keeper'),
  ]);
  
  return <FieldsClient fields={fields} schools={schools} groundkeepers={groundkeepers} />;
}
