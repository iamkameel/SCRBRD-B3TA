import FinancialsClient from './client';
import { getTransactions } from '@/lib/actions/financials';

export default async function FinancialsPage() {
  const transactions = await getTransactions();
  return <FinancialsClient transactions={transactions} />;
}
