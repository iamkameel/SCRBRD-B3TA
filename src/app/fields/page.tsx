
import { getFields } from '@/lib/actions/fields';
import { getSchools } from '@/lib/actions/schools';
import FieldsClient from './client';

export default async function FieldsPage() {
  const [fields, schools] = await Promise.all([
    getFields(),
    getSchools(),
  ]);
  
  return <FieldsClient fields={fields} schools={schools} />;
}
