
'use server';

import BillingClient from './client';
import { getInvoices } from '@/lib/actions/billing';
import { getSchools } from '@/lib/actions/schools';
import type { Invoice } from '@/lib/data';

export default async function BillingPage() {
  const [invoices, schools] = await Promise.all([
    getInvoices(),
    getSchools(),
  ]);

  const serializedInvoices = invoices.map(invoice => ({
    ...invoice,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
  }));

  return <BillingClient initialInvoices={serializedInvoices as unknown as Invoice[]} clients={schools} />;
}
