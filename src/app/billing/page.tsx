
import BillingClient from './client';

export default async function BillingPage() {
  // In a real implementation, you would fetch billing data here.
  // For now, we'll pass empty arrays to the client component.
  const data = {
    estimates: [],
    invoices: [],
    statements: [],
    receipts: [],
  };
  return <BillingClient initialData={data} />;
}
