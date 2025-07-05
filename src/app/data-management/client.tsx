

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
import { useToast } from "@/hooks/use-toast";
import { migrateSampleDataAction, deleteAllDataAction, migrateSubsetAction, deleteSubsetAction, type SubsetName } from "@/lib/actions/data-management";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    { name: 'Sponsors' },
    { name: 'Equipment' },
    { name: 'Drills' },
];

const INDEPENDENT_SUBSETS: SubsetName[] = [
    'Schools', 'Divisions', 'Seasons', 'Fields', 'People', 'Financials', 'Equipment', 'Drills', 'Sponsors'
];

export default function DataManagementClient() {
  const [isMigrating, startMigrationTransition] = React.useTransition();
  const [isDeleting, startDeletionTransition] = React.useTransition();
  const [actionToConfirm, setActionToConfirm] = React.useState<'migrateAll' | 'deleteAll' | SubsetName | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
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
            Manage your application data using sample sets.
          </p>
        </header>
        
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
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => { setActionToConfirm('migrateAll'); setDialogOpen(true); }} disabled={isProcessing}>
                                    {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                                    Migrate All Sample Data
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Replaces all current data with the complete sample dataset.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" onClick={() => { setActionToConfirm('deleteAll'); setDialogOpen(true); }} disabled={isProcessing}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TriangleAlert className="mr-2 h-4 w-4" />}
                                    Delete All Data
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Permanently deletes all data from all collections in the database.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                        Migrate sample data for a specific type of data, or delete all records for that type. Actions on dependent data types are disabled.
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
                        {SUBSETS.map(({name}) => {
                          const isIndependent = INDEPENDENT_SUBSETS.includes(name);
                          return (
                            <TableRow key={name}>
                              <TableCell className="font-medium">{name}</TableCell>
                              <TableCell className="flex justify-end gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={!isIndependent ? 0 : -1}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleMigrateSubset(name)}
                                                        disabled={isProcessing || !isIndependent}
                                                    >
                                                        <DatabaseZap className="mr-2 h-4 w-4" /> Migrate
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{isIndependent ? `Replaces all existing ${name} data with the sample set.` : `Migration for ${name} depends on other data. Use 'Migrate All' instead.`}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={!isIndependent ? 0 : -1}>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => { setActionToConfirm(name); setDialogOpen(true); }}
                                                        disabled={isProcessing || !isIndependent}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{isIndependent ? `Permanently deletes all ${name} data.` : `Deletion for ${name} depends on other data. Use 'Delete All' instead.`}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
      </div>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                {actionToConfirm === 'migrateAll' && "This will replace all current application data with the sample dataset. This action cannot be undone."}
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
