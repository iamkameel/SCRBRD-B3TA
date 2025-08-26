
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


interface BillingData {
  estimates: any[];
  invoices: any[];
  statements: any[];
  receipts: any[];
}

interface BillingClientProps {
  initialData: BillingData;
}

const EmptyState = ({ title, description }: { title: string, description: string }) => (
  <TableRow>
    <TableCell colSpan={4} className="h-24 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </TableCell>
  </TableRow>
);

function CreateDocumentDialog() {
    const [open, setOpen] = React.useState(false);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Create New Document
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Wrench/>Feature Under Construction</DialogTitle>
                    <DialogDescription className="pt-4">
                        The ability to create new estimates, invoices, and other billing documents is coming soon!
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default function BillingClient({ initialData }: BillingClientProps) {
  const { estimates, invoices, statements, receipts } = initialData;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing</h1>
          <p className="text-muted-foreground">Manage cost estimates, invoices, statements, and receipts.</p>
        </div>
        <CreateDocumentDialog />
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
                    <TableRow>
                        <TableCell className="font-medium">INV-001</TableCell>
                        <TableCell>Durban High School</TableCell>
                        <TableCell>2024-06-15</TableCell>
                        <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
                        <TableCell className="text-right">$1,250.00</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">INV-002</TableCell>
                        <TableCell>Hilton College</TableCell>
                        <TableCell>2024-07-01</TableCell>
                        <TableCell><Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge></TableCell>
                        <TableCell className="text-right">$800.00</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">INV-003</TableCell>
                        <TableCell>Michaelhouse</TableCell>
                        <TableCell>2024-05-20</TableCell>
                        <TableCell><Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge></TableCell>
                        <TableCell className="text-right">$2,500.00</TableCell>
                    </TableRow>
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
  );
}
