
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, FileBarChart, Receipt, FileClock, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Invoice, School } from '@/lib/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { InvoiceDialog } from './invoice-dialog';

interface BillingClientProps {
  initialInvoices: Invoice[];
  clients: School[];
}

const EmptyState = ({ title, description }: { title: string, description: string }) => (
  <TableRow>
    <TableCell colSpan={5} className="h-24 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </TableCell>
  </TableRow>
);

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function BillingClient({ initialInvoices, clients }: BillingClientProps) {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing</h1>
            <p className="text-muted-foreground">Manage cost estimates, invoices, statements, and receipts.</p>
          </div>
          <Button onClick={() => setIsInvoiceDialogOpen(true)}>
              <PlusCircle className="mr-2" />
              Create New Invoice
          </Button>
        </header>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="estimates"><FileClock className="mr-2 h-4 w-4" />Estimates</TabsTrigger>
            <TabsTrigger value="invoices"><FileText className="mr-2 h-4 w-4" />Invoices</TabsTrigger>
            <TabsTrigger value="statements"><FileBarChart className="mr-2 h-4 w-4" />Statements</TabsTrigger>
            <TabsTrigger value="receipts"><Receipt className="mr-2 h-4 w-4" />Receipts</TabsTrigger>
          </TabsList>
          <TabsContent value="estimates" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Cost Estimates</CardTitle><CardDescription>A list of all cost estimates sent out.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Estimate #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody><EmptyState title="No Estimates" description="Cost estimates will appear here once created." /></TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>A list of all invoices issued.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {initialInvoices.length > 0 ? initialInvoices.map(invoice => {
                       const statusVariant = {
                          'Paid': 'bg-green-100 text-green-800',
                          'Sent': 'bg-blue-100 text-blue-800',
                          'Overdue': 'bg-red-100 text-red-800',
                          'Draft': 'bg-gray-100 text-gray-800',
                       }[invoice.status];
                       
                       return (
                          <TableRow key={invoice.invoiceId}>
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{invoice.clientName}</TableCell>
                              <TableCell>{format(invoice.issueDate, 'dd MMM yyyy')}</TableCell>
                              <TableCell><Badge variant="secondary" className={cn("capitalize", statusVariant)}>{invoice.status}</Badge></TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(invoice.total)}</TableCell>
                          </TableRow>
                       )
                    }) : <EmptyState title="No Invoices" description="New invoices will appear here once created." />}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="statements" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Statements</CardTitle><CardDescription>A list of all account statements.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Statement #</TableHead><TableHead>Client</TableHead><TableHead>Date Range</TableHead><TableHead className="text-right">Balance Due</TableHead></TableRow></TableHeader>
                  <TableBody><EmptyState title="No Statements" description="Statements will appear here once generated." /></TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="receipts" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Receipts</CardTitle><CardDescription>A list of all payment receipts.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Receipt #</TableHead><TableHead>Client</TableHead><TableHead>Payment Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody><EmptyState title="No Receipts" description="Receipts for paid invoices will appear here." /></TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <InvoiceDialog 
        clients={clients} 
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
      />
    </>
  );
}
