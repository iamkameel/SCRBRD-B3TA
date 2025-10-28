
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Transaction, Person } from '@/lib/data';
import { cache } from 'react';
import { getPerson } from './players';
import { getUserId } from '@/lib/firebase-admin';

const checkManagementPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Sportsmaster'))) {
        throw new Error("You do not have permission to manage financials.");
    }
}

export async function getTransactions(): Promise<Transaction[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const transactionsCollection = collection(db, 'financials');
    const q = query(transactionsCollection);
    const transactionSnapshot = await getDocs(q);
    const transactionsList = transactionSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            transactionId: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as Transaction;
    });
    return transactionsList.sort((a,b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

const transactionSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(['Income', 'Expense']),
  category: z.enum(['Registration Fee', 'Sponsorship', 'Venue Hire', 'Equipment', 'Umpire Fees', 'Other']),
  date: z.date(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export async function addTransactionAction(data: TransactionFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  const validatedFields = transactionSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid transaction data.');
  }
  
  try {
    await addDoc(collection(db, 'financials'), {
      ...validatedFields.data,
      date: Timestamp.fromDate(validatedFields.data.date),
      userId,
    });
  } catch (error) {
    console.error("Error adding transaction: ", error);
    throw new Error("Could not add transaction.");
  }
  
  revalidatePath('/financials');
}

const updateTransactionSchema = transactionSchema.extend({
  transactionId: z.string(),
});

export async function updateTransactionAction(data: z.infer<typeof updateTransactionSchema>) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");
    await checkManagementPermission(userId);
    const validatedFields = updateTransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        throw new Error('Invalid transaction data.');
    }

    const { transactionId, ...updateData } = validatedFields.data;
    const transactionDocRef = doc(db, 'financials', transactionId);

    const transactionSnap = await getDoc(transactionDocRef);
    if (!transactionSnap.exists()) {
        throw new Error("Transaction not found or you do not have permission to edit it.");
    }

    try {
        await updateDoc(transactionDocRef, {
            ...updateData,
            date: Timestamp.fromDate(updateData.date)
        });
    } catch (error) {
        console.error("Error updating transaction:", error);
        throw new Error("Could not update transaction.");
    }

    revalidatePath('/financials');
}

export async function deleteTransactionAction(transactionId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkManagementPermission(userId);
  if (!transactionId) throw new Error("Transaction ID is required.");
  
  const transactionDocRef = doc(db, 'financials', transactionId);
  const transactionSnap = await getDoc(transactionDocRef);
  if (!transactionSnap.exists()) {
    throw new Error("Transaction not found or you do not have permission to delete it.");
  }
  
  try {
    await deleteDoc(transactionDocRef);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw new Error("Could not delete transaction.");
  }

  revalidatePath('/financials');
}
