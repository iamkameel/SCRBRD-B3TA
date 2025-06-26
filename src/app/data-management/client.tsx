'use client';

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, Upload, Trash2, ShieldAlert, Loader2, FileDown, FileUp } from "lucide-react";
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
import { deleteDataSubsetAction, deleteAllDataAction, exportDataSubsetAction, importDataSubsetAction, exportAllDataAction, importAllDataAction } from "@/lib/actions/data-management";

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
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [isExporting, startExportTransition] = React.useTransition();
  const [isImporting, startImportTransition] = React.useTransition();
  
  const [subsetToDelete, setSubsetToDelete] = React.useState<string | null>(null);
  const [currentExport, setCurrentExport] = React.useState<string | null>(null);
  const [currentImport, setCurrentImport] = React.useState<string | null>(null);

  const subsetFileInputRef = React.useRef<HTMLInputElement>(null);
  const allDataFileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isProcessing = isDeleting || isExporting || isImporting;

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

  const handleImportClick = (subset: string) => {
    setCurrentImport(subset);
    subsetFileInputRef.current?.click();
  };

  const handleSubsetFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentImport) return;

    const subset = currentImport;
    startImportTransition(async () => {
      toast({ title: "Importing...", description: `Processing ${subset} data from ${file.name}.` });
      
      const fileContent = await file.text();
      const result = await importDataSubsetAction(subset, fileContent);

      if (result.success) {
        toast({ title: "Import Complete", description: result.message });
      } else {
        toast({ title: "Import Failed", description: result.message, variant: "destructive" });
      }
      setCurrentImport(null);
    });
    // Reset file input
    if (subsetFileInputRef.current) {
        subsetFileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = (subset: string) => {
    setSubsetToDelete(subset);
  };

  const handleConfirmDelete = () => {
    if (!subsetToDelete) return;
    startDeleteTransition(async () => {
        toast({ title: "Deleting...", description: `Removing all ${subsetToDelete} data.` });
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
        toast({ title: "Deleting All Data...", description: "This may take a moment." });
        const result = await deleteAllDataAction();
        if (result.success) {
            toast({ title: "All Data Deleted", description: result.message, variant: "destructive" });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    });
  }

  const handleExportAllClick = () => {
    setCurrentExport('all');
    startExportTransition(async () => {
      toast({ title: "Exporting...", description: "Preparing all application data for download." });
      const result = await exportAllDataAction();

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrbrd_all_data_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: "All application data has been downloaded." });
      } else {
        toast({ title: "Export Failed", description: result.message, variant: "destructive" });
      }
      setCurrentExport(null);
    });
  };

  const handleImportAllClick = () => {
    setCurrentImport('all');
    allDataFileInputRef.current?.click();
  };

  const handleAllDataFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startImportTransition(async () => {
      toast({ title: "Importing...", description: `Processing all data from ${file.name}.` });
      
      const fileContent = await file.text();
      const result = await importAllDataAction(fileContent);

      if (result.success) {
        toast({ title: "Import Complete", description: result.message });
      } else {
        toast({ title: "Import Failed", description: result.message, variant: "destructive" });
      }
      setCurrentImport(null);
    });
    if (allDataFileInputRef.current) {
        allDataFileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input type="file" ref={subsetFileInputRef} onChange={handleSubsetFileChange} accept=".json" style={{ display: 'none' }} />
      <input type="file" ref={allDataFileInputRef} onChange={handleAllDataFileChange} accept=".json" style={{ display: 'none' }} />

      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Data Management
          </h1>
          <p className="text-muted-foreground">
            Export, import, or clear your application data.
          </p>
        </header>

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
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleExportClick(subset)} disabled={isProcessing}>
                              {isExporting && currentExport === subset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Export {subset}</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleImportClick(subset)} disabled={isProcessing}>
                              {isImporting && currentImport === subset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Import {subset}</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(subset)} disabled={isProcessing}>
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

        <Card>
          <CardHeader>
            <CardTitle>Bulk Data Operations</CardTitle>
            <CardDescription>
              Export or import all your application data at once. This is useful for backups.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-bold">Export All Data</p>
                <p className="text-xs text-muted-foreground">Download a single file containing all app data.</p>
              </div>
              <Button onClick={handleExportAllClick} disabled={isProcessing}>
                {isExporting && currentExport === 'all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-bold">Import All Data</p>
                <p className="text-xs text-muted-foreground">Upload a file to restore all app data.</p>
              </div>
               <Button onClick={handleImportAllClick} disabled={isProcessing} variant="outline">
                {isImporting && currentImport === 'all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                Import
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    <Button variant="destructive" disabled={isProcessing}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
