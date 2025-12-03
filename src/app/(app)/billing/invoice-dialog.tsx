
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { School } from '@/lib/data';
import { addInvoiceAction } from '@/lib/actions/billing';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Price must be positive'),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
  notes: z.string().optional(),
}).refine(data => data.dueDate >= data.issueDate, {
    message: "Due date must be on or after issue date.",
    path: ["dueDate"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceDialog({ clients, open, onOpenChange }: { clients: School[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = form.watch('lineItems');
  const subtotal = React.useMemo(() => 
    lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
    [lineItems]
  );
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  React.useEffect(() => {
    if (open) {
      form.reset({
        issueDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: '',
        clientId: undefined,
      });
    }
  }, [open, form]);

  const onSubmit = (data: InvoiceFormValues) => {
    startTransition(async () => {
      try {
        await addInvoiceAction(data);
        toast({ title: 'Invoice Created', description: 'The new invoice has been saved as a draft.' });
        onOpenChange(false);
      } catch (error) {
        toast({ title: 'Error', description: error instanceof Error ? error.message : 'Could not create invoice.', variant: 'destructive' });
      }
    });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Fill in the details below to issue a new invoice.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>{clients.map(c => <SelectItem key={c.schoolId} value={c.schoolId}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="issueDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                   <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
            </div>
            
            <Separator />

            <div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start mb-2">
                  <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => <FormItem className="col-span-6"><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <FormItem className="col-span-2"><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => <FormItem className="col-span-2"><FormControl><Input type="number" placeholder="Price" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <div className="col-span-2 flex items-center justify-between">
                    <p className="font-mono text-sm pt-2">{formatCurrency(lineItems[index]?.quantity * lineItems[index]?.unitPrice)}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))}
               <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}><PlusCircle className="mr-2 h-4 w-4" />Add Line Item</Button>
            </div>
            
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <Separator />
                    <div className="flex justify-between"><p className="text-muted-foreground">Subtotal</p><p>{formatCurrency(subtotal)}</p></div>
                    <div className="flex justify-between"><p className="text-muted-foreground">Tax (15%)</p><p>{formatCurrency(tax)}</p></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><p>Total</p><p>{formatCurrency(total)}</p></div>
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Invoice'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
