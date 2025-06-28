
'use client';

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, DatabaseZap, Trash2, TriangleAlert, Upload, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { migrateSampleDataAction, deleteAllDataAction, migrateSubsetAction, deleteSubsetAction, type SubsetName } from "@/lib/actions/data-management";

const SUBSETS: { name: SubsetName }[] = [
    { name: 'Schools' },
    { name: 'Divisions' },
    { name: 'Seasons' },
    { name: 'Fields' },
    { name: 'People' },
    { name: 'Competitions' },
    { name: 'Teams' },
    { name: 'Matches' },
    { name: 'Financials' },
    { name: 'Equipment' },
];

export default function DataManagementClient() {
  const [isMigrating, startMigrationTransition] = React.useTransition();
  const [isDeleting, startDeletionTransition] = React.useTransition();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [actionToConfirm, setActionToConfirm] = React.useState<'migrateAll' | 'deleteAll' | SubsetName | null>(null);
  
  const { toast } = useToast();

  const handleAction = () => {
    if (!actionToConfirm) return;

    if (actionToConfirm === 'migrateAll') {
      startMigrationTransition(async () => {
        toast({ title: "Starting Data Migration...", description: "This may take a moment. Your existing data will be replaced." });
        const result = await migrateSampleDataAction();
        if (result.success) {
          toast({ title: "Migration Complete", description: result.message });
        } else {
          toast({ title: "Migration Failed", description: result.message, variant: "destructive" });
        }
      });
    } else if (actionToConfirm === 'deleteAll') {
       startDeletionTransition(async () => {
        toast({ title: "Deleting All Data...", description: "This may take a moment." });
        const result = await deleteAllDataAction();
        if (result.success) {
          toast({ title: "Deletion Complete", description: result.message });
        } else {
          toast({ title: "Deletion Failed", description: result.message, variant: "destructive" });
        }
      });
    } else { // It's a subset deletion
      startDeletionTransition(async () => {
        const subset = actionToConfirm;
        toast({ title: `Deleting ${subset}...` });
        const result = await deleteSubsetAction(subset);
        if (result.success) {
          toast({ title: "Deletion Complete", description: result.message });
        } else {
          toast({ title: "Deletion Failed", description: result.message, variant: "destructive" });
        }
      });
    }

    setDialogOpen(false);
    setActionToConfirm(null);
  };
  
  const handleMigrateSubset = (subset: SubsetName) => {
    startMigrationTransition(async () => {
      toast({ title: `Migrating ${subset}...` });
      const result = await migrateSubsetAction(subset);
      if (result.success) {
        toast({ title: "Migration Complete", description: result.message });
      } else {
        toast({ title: "Migration Failed", description: result.message, variant: "destructive" });
      }
    });
  }

  const isProcessing = isMigrating || isDeleting;

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Data Management
          </h1>
          <p className="text-muted-foreground">
            Manage your application data using sample sets or your own files.
          </p>
        </header>
        
        <Tabs defaultValue="sample-data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
                <TabsTrigger value="import-export">Import & Export</TabsTrigger>
            </TabsList>
            <TabsContent value="sample-data" className="mt-4">
                 <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Bulk Data Operations</AccordionTrigger>
                        <AccordionContent>
                        <Card>
                            <CardHeader>
                            <CardTitle>Sample Data & Deletion</CardTitle>
                            <CardDescription>
                                Use these actions to populate your entire database with sample data for demonstration, or to delete all existing data.
                            </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={() => { setActionToConfirm('migrateAll'); setDialogOpen(true); }} disabled={isProcessing}>
                                {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                                Migrate All Sample Data
                            </Button>
                            <Button variant="destructive" onClick={() => { setActionToConfirm('deleteAll'); setDialogOpen(true); }} disabled={isProcessing}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TriangleAlert className="mr-2 h-4 w-4" />}
                                Delete All Data
                            </Button>
                            </CardContent>
                        </Card>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Manage Data Subsets</AccordionTrigger>
                        <AccordionContent>
                        <Card>
                            <CardHeader>
                            <CardTitle>Individual Data Subsets</CardTitle>
                            <CardDescription>
                                Migrate sample data or delete all records for a specific data type.
                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Data Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {SUBSETS.map(({name}) => (
                                    <TableRow key={name}>
                                    <TableCell className="font-medium">{name}</TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleMigrateSubset(name)} disabled={isProcessing}>
                                            <DatabaseZap className="mr-2 h-4 w-4" /> Migrate
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => { setActionToConfirm(name); setDialogOpen(true); }} disabled={isProcessing}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            </CardContent>
                        </Card>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
            </TabsContent>
            <TabsContent value="import-export" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Data</CardTitle>
                            <CardDescription>
                                Upload a CSV file to import data from previous seasons or other systems. This feature is coming soon.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2"/>
                                <p className="text-muted-foreground mb-4">Drag & drop your file here or</p>
                                <Button disabled>Choose File</Button>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Export Data</CardTitle>
                            <CardDescription>
                                Download all your application data as a set of CSV files for backup or offline analysis. This feature is coming soon.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg">
                                <Download className="h-8 w-8 text-muted-foreground mb-2"/>
                                <p className="text-muted-foreground mb-4">Export will generate a zip file of CSVs.</p>
                                <Button disabled>Export All Data</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
      </div>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                {actionToConfirm === 'migrateAll' && "This will delete all your current data before importing the sample data set. This action cannot be undone."}
                {actionToConfirm === 'deleteAll' && "This will permanently delete all of your application data. This action cannot be undone."}
                {actionToConfirm && actionToConfirm !== 'migrateAll' && actionToConfirm !== 'deleteAll' && `This will permanently delete all ${actionToConfirm} data. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionToConfirm(null)} disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={buttonVariants({ variant: (actionToConfirm !== 'migrateAll') ? "destructive" : "default" })}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Yes, proceed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
