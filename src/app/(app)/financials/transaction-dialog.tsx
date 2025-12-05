
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/data";
import { addTransactionAction, updateTransactionAction } from '@/lib/actions/financials';
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(['Income', 'Expense'], { required_error: "Please select a type." }),
  category: z.enum(['Registration Fee', 'Sponsorship', 'Venue Hire', 'Equipment', 'Umpire Fees', 'Other'], { required_error: "Please select a category." }),
  date: z.date({ required_error: "A date is required." }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;
const TRANSACTION_TYPES = ['Income', 'Expense'] as const;
const TRANSACTION_CATEGORIES = ['Registration Fee', 'Sponsorship', 'Venue Hire', 'Equipment', 'Umpire Fees', 'Other'] as const;

export function TransactionDialog({ mode, transaction, open, onOpenChange }: { mode: 'add' | 'edit', transaction?: Transaction, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: mode === 'edit' && transaction ? { ...transaction, date: new Date(transaction.date) } : {
      type: 'Expense', category: 'Other', date: new Date(),
    },
  });
  
  React.useEffect(() => {
    if (open) {
        form.reset(mode === 'edit' && transaction ? {...transaction, date: new Date(transaction.date)} : { description: '', amount: 0, type: 'Expense', category: 'Other', date: new Date() });
    }
  }, [transaction, mode, open, form]);

  function onSubmit(data: TransactionFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && transaction) {
          await updateTransactionAction({ transactionId: transaction.transactionId, ...data });
          toast({ title: "Transaction Updated", description: `The transaction for ${data.description} has been updated.` });
        } else {
          await addTransactionAction(data);
          toast({ title: "Transaction Added", description: `The transaction for ${data.description} has been added.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} transaction.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          <DialogDescription>Enter the details for the financial transaction.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. League Registration Fees" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl><SelectContent>{TRANSACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger></FormControl><SelectContent>{TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Transaction"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
