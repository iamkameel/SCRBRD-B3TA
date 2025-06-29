

import FinancialsClient from './client';
import { getTransactions } from '@/lib/actions/financials';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/auth';

export default async function FinancialsPage() {
  const transactions = await getTransactions();

  const userId = getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.includes('Admin') ?? false;

  return <FinancialsClient transactions={transactions} isAdmin={isAdmin} />;
}
