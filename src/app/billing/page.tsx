
'use server';

import BillingClient from './client';
import { getInvoices } from '@/lib/actions/billing';
import { getSchools } from '@/lib/actions/schools';

export default async function BillingPage() {
  const [invoices, schools] = await Promise.all([
    getInvoices(),
    getSchools(),
  ]);

  return <BillingClient initialInvoices={invoices} clients={schools} />;
}
