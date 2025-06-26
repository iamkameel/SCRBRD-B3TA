'use client';

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, Upload, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteDataSubsetAction, deleteAllDataAction, exportDataSubsetAction } from "@/lib/actions/data-management";

const DATA_SUBSETS = [
  "People",
  "Schools",
  "Divisions",
  "Seasons",
  "Fields",
  "Teams",
  "Matches",
];

export default function DataManagementClient() {
  const [subsetToDelete, setSubsetToDelete] = React.useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [isExporting, startExportTransition] = React.useTransition();
  const [currentExport, setCurrentExport] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleExportClick = (subset: string) => {
    setCurrentExport(subset);
    startExportTransition(async () => {
      toast({ title: "Exporting...", description: `Preparing ${subset} data for download.` });
      const result = await exportDataSubsetAction(subset);

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${subset.toLowerCase().replace(/\s/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: `Your ${subset} data has been downloaded.` });
      } else {
        toast({ title: "Export Failed", description: result.message, variant: "destructive" });
      }
      setCurrentExport(null);
    });
  };

  const handleDeleteClick = (subset: string) => {
    setSubsetToDelete(subset);
  };

  const handleConfirmDelete = () => {
    if (!subsetToDelete) return;
    startDeleteTransition(async () => {
        const result = await deleteDataSubsetAction(subsetToDelete);
        if (result.success) {
            toast({ title: "Data Deleted", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setSubsetToDelete(null);
    });
  }
  
  const handleConfirmDeleteAll = () => {
    startDeleteTransition(async () => {
        const result = await deleteAllDataAction();
        if (result.success) {
            toast({ title: "All Data Deleted", description: result.message, variant: "destructive" });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Data Management
          </h1>
          <p className="text-muted-foreground">
            Export, import, or clear your application data.
          </p>
        </header>

        {/* Data Subset Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Data Subsets</CardTitle>
            <CardDescription>
              Perform actions on specific categories of your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider>
                <div className="space-y-3">
                {DATA_SUBSETS.map((subset) => (
                    <div key={subset} className="flex items-center justify-between rounded-lg border p-4">
                    <p className="font-medium">{subset} Data</p>
                    <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleExportClick(subset)} disabled={isDeleting || isExporting}>
                              {isExporting && currentExport === subset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Export {subset}</p></TooltipContent>
                        </Tooltip>

                        {/* Import Button */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "Import Started", description: `Importing ${subset} data...`})} disabled={isDeleting || isExporting}>
                            <Upload className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Import {subset}</p></TooltipContent>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(subset)} disabled={isDeleting || isExporting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete {subset}</p></TooltipContent>
                        </Tooltip>
                    </div>
                    </div>
                ))}
                </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Danger Zone / Delete Card */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>
              This action is irreversible and will permanently remove data.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                <div>
                    <p className="font-bold text-destructive">Delete All Application Data</p>
                    <p className="text-xs text-muted-foreground">Permanently delete everything, including all subsets.</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting || isExporting}>
                        Delete All
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete ALL data from the application, including teams, players, and matches.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className={buttonVariants({ variant: "destructive" })}
                                onClick={handleConfirmDeleteAll}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Yes, delete everything"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* This dialog is now correctly triggered by the delete buttons above */}
      <AlertDialog open={!!subsetToDelete} onOpenChange={(open) => !open && setSubsetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all <strong>{subsetToDelete}</strong> data from the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubsetToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
            >
                {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}