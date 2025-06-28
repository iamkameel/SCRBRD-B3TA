
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { PlusCircle, MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown, Scale, CalendarIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/data";
import { addTransactionAction, updateTransactionAction, deleteTransactionAction } from '@/lib/actions/financials';
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

function TransactionDialog({ mode, transaction, open, onOpenChange }: { mode: 'add' | 'edit', transaction?: Transaction, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: mode === 'edit' && transaction ? { ...transaction } : {
      type: 'Expense', category: 'Other', date: new Date(),
    },
  });
  
  React.useEffect(() => {
    if (open) {
        form.reset(mode === 'edit' && transaction ? transaction : { description: '', amount: 0, type: 'Expense', category: 'Other', date: new Date() });
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
            <div className="grid grid-cols-2 gap-4">
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

export default function FinancialsClient({ transactions }: { transactions: Transaction[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedTransaction) return;
    startTransition(async () => {
      try {
        await deleteTransactionAction(selectedTransaction.transactionId);
        toast({ title: "Transaction Deleted", description: "The transaction has been deleted." });
        setIsDeleteDialogOpen(false);
        setSelectedTransaction(null);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not delete transaction.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setSelectedTransaction(null);
      }
    });
  };

  const summary = React.useMemo(() => {
    const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Financials</h1><p className="text-muted-foreground">Manage your income and expenses.</p></div>
          <Button onClick={() => { setDialogMode('add'); setSelectedTransaction(null); setIsDialogOpen(true); }}><PlusCircle className="mr-2"/>Add Transaction</Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.income)}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(summary.expense)}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Balance</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={cn("text-2xl font-bold", summary.balance < 0 && "text-destructive")}>{formatCurrency(summary.balance)}</div></CardContent></Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>A list of all financial transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <TableRow key={t.transactionId}>
                      <TableCell>{format(t.date, 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell><Badge variant={t.type === 'Income' ? 'secondary' : 'destructive'} className={t.type === 'Income' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}>{t.type}</Badge></TableCell>
                      <TableCell className={cn("text-right font-mono", t.type === 'Income' ? 'text-green-600' : 'text-destructive')}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedTransaction(t); setDialogMode('edit'); setIsDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedTransaction(t); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No transactions found. Get started by adding one.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TransactionDialog mode={dialogMode} transaction={selectedTransaction ?? undefined} open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction: <strong>{selectedTransaction?.description}</strong>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })} disabled={isPending}>{isPending ? "Deleting..." : "Delete Transaction"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
