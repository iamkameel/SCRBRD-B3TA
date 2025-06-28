
import { getFields } from '@/lib/actions/fields';
import { getPeopleByRole } from '@/lib/actions/players';
import { getSchools } from '@/lib/actions/schools';
import FieldsClient from './client';

export default async function FieldsPage() {
  const [fields, groundkeepers, schools] = await Promise.all([
    getFields(),
    getPeopleByRole('Grounds-Keeper'),
    getSchools(),
  ]);
  
  return <FieldsClient fields={fields} groundkeepers={groundkeepers} schools={schools} />;
}
