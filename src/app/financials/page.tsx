
'use server';

import FinancialsClient from './client';
import { getTransactions } from '@/lib/actions/financials';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';

export default async function FinancialsPage() {
  const transactions = await getTransactions();

  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'Sportsmaster'].includes(r)) ?? false;

  return <FinancialsClient transactions={transactions} isAdmin={isAdmin} />;
}
