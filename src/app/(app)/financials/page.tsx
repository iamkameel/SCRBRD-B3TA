
'use server';

import FinancialsClient from './client';
import { getTransactions } from '@/lib/actions/financials';
import { getPerson } from '@/lib/actions/players';
import { getUserId } from '@/lib/server-auth';
import type { Transaction } from '@/lib/data';

export default async function FinancialsPage() {
  const transactions = await getTransactions();

  const userId = await getUserId();
  const user = userId ? await getPerson(userId) : null;
  const isAdmin = user?.roles.some(r => ['Admin', 'System Architect'].includes(r)) ?? false;

  const serializableTransactions = transactions.map(t => ({...t, date: t.date.toISOString()}));

  return <FinancialsClient transactions={serializableTransactions as unknown as Transaction[]} isAdmin={isAdmin} />;
}
