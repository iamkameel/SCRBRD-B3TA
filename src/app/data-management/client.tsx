'use client';

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, DatabaseZap } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { migrateSampleDataAction } from "@/lib/actions/data-management";

export default function DataManagementClient() {
  const [isMigrating, startMigrationTransition] = React.useTransition();
  const { toast } = useToast();

  const handleMigrate = () => {
    startMigrationTransition(async () => {
      toast({ title: "Starting Data Migration...", description: "This may take a moment. Your existing data will be replaced." });
      const result = await migrateSampleDataAction();

      if (result.success) {
        toast({ title: "Migration Complete", description: result.message });
      } else {
        toast({ title: "Migration Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Data Management
        </h1>
        <p className="text-muted-foreground">
          Manage your application data.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sample Data Migration</CardTitle>
          <CardDescription>
            Populate your database with a complete set of sample data. This is useful for demonstrating the app's features.
            <strong className="block mt-2 text-destructive">Warning: This will delete all your current data and replace it.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isMigrating}>
                {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                Migrate Sample Data to Firebase
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all current data in your database and replace it with the sample data set.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isMigrating}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMigrate}
                  className={buttonVariants({ variant: "destructive" })}
                  disabled={isMigrating}
                >
                  {isMigrating ? "Migrating..." : "Yes, replace all data"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
