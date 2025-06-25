'use client';

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, Upload, Trash2, ShieldAlert } from "lucide-react";
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
  const { toast } = useToast();

  const handleDeleteClick = (subset: string) => {
    setSubsetToDelete(subset);
  };

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
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "Export Started", description: `Exporting ${subset} data...` })}>
                            <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Export {subset}</p></TooltipContent>
                        </Tooltip>

                        {/* Import Button */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "Import Started", description: `Importing ${subset} data...`})}>
                            <Upload className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Import {subset}</p></TooltipContent>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(subset)}>
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
                    <Button variant="destructive">
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
                                onClick={() => {
                                  console.log("Deleting all data...");
                                  toast({
                                    title: "All Data Deleted",
                                    description: "All application data has been permanently deleted.",
                                    variant: "destructive",
                                  });
                                }}
                            >
                                Yes, delete everything
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
              This action cannot be undone. This will permanently delete all <strong>{subsetToDelete}</strong> data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubsetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => {
                    console.log(`Deleting ${subsetToDelete}`);
                    toast({
                        title: "Data Deleted",
                        description: `The ${subsetToDelete} data has been deleted.`
                    });
                    setSubsetToDelete(null);
                }}
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
