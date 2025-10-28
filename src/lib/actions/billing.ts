
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Invoice } from '@/lib/data';
import { getPerson } from './players';
import { getSchool } from './schools';
import { getUserId } from '@/lib/auth';

const checkBillingPermission = async (userId: string) => {
    const user = await getPerson(userId);
    if (!user || !user.roles.includes('Admin')) {
        throw new Error("You do not have permission to manage billing.");
    }
};

export async function getInvoices(): Promise<Invoice[]> {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const invoicesCollection = collection(db, 'invoices');
    const q = query(invoicesCollection);
    const invoiceSnapshot = await getDocs(q);
    const invoiceList = invoiceSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            invoiceId: doc.id,
            ...data,
            issueDate: (data.issueDate as Timestamp).toDate(),
            dueDate: (data.dueDate as Timestamp).toDate(),
        } as Invoice;
    });
    return invoiceList.sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime());
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export async function addInvoiceAction(data: InvoiceFormValues) {
  const userId = await getUserId();
  if (!userId) throw new Error("User not authenticated");
  await checkBillingPermission(userId);

  const validatedFields = invoiceSchema.safeParse(data);
  if (!validatedFields.success) {
    throw new Error('Invalid invoice data.');
  }
  
  const { clientId, issueDate, dueDate, lineItems, notes } = validatedFields.data;

  const client = await getSchool(clientId);
  if(!client) throw new Error("Client school not found.");

  let subtotal = 0;
  const finalLineItems = lineItems.map(item => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return { ...item, id: doc(collection(db, 'invoices')).id, total };
  });

  const tax = subtotal * 0.15; // Example 15% tax
  const total = subtotal + tax;

  const invoiceCountSnap = await getDocs(collection(db, 'invoices'));
  const invoiceNumber = `INV-${(invoiceCountSnap.size + 1).toString().padStart(4, '0')}`;

  try {
    await addDoc(collection(db, 'invoices'), {
      invoiceNumber,
      clientId,
      clientName: client.name,
      issueDate: Timestamp.fromDate(issueDate),
      dueDate: Timestamp.fromDate(dueDate),
      status: 'Draft',
      lineItems: finalLineItems,
      subtotal,
      tax,
      total,
      notes: notes || '',
      userId,
    });
  } catch (error) {
    console.error("Error adding invoice: ", error);
    throw new Error("Could not add invoice.");
  }
  
  revalidatePath('/billing');
}
