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

  const handleDeleteClick = (subset: string) => {
    // This function will be called by the AlertDialogTrigger's child,
    // even if it's a disabled button. However, for a real disabled button,
    // you might need to handle the trigger differently.
    // Since the functionality is not yet implemented, we'll proceed.
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

        <Card>
          <CardHeader>
            <CardTitle>Data Subsets</CardTitle>
            <CardDescription>
              Perform actions on individual data categories. All actions are currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DATA_SUBSETS.map((subset) => (
              <div key={subset} className="flex items-center justify-between rounded-lg border p-4">
                <p className="font-medium">{subset}</p>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export {subset}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Import {subset}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Delete {subset}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>
              This action is irreversible and will permanently remove all data associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled>
                    Delete All Application Data
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
                            onClick={() => console.log("Deleting all data...")}
                        >
                            Yes, delete everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

       {/* This dialog is a placeholder for when delete functionality is enabled */}
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
