
import { getFields } from '@/lib/actions/fields';
import { getSchools } from '@/lib/actions/schools';
import { getPeopleByRole } from '@/lib/actions/players';
import FieldsClient from './client';

export default async function FieldsPage() {
  const [fields, schools, groundskeepers] = await Promise.all([
    getFields(),
    getSchools(),
    getPeopleByRole('Grounds-Keeper'),
  ]);
  
  return <FieldsClient fields={fields} schools={schools} groundskeepers={groundkeepers} />;
}
