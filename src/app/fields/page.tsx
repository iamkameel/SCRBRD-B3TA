import { getFields } from '@/lib/actions/fields';
import FieldsClient from './client';

export default async function FieldsPage() {
  const fields = await getFields();
  return <FieldsClient fields={fields} />;
}
