'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { importAllDataAction } from "@/lib/actions/data-management";

export default function DataManagementClient() {
  const [isImporting, startImportTransition] = React.useTransition();
  const allDataFileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportAllClick = () => {
    allDataFileInputRef.current?.click();
  };

  const handleAllDataFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startImportTransition(async () => {
      toast({ title: "Migrating Data...", description: `Processing data from ${file.name}. This may take a moment.` });
      
      const fileContent = await file.text();
      const result = await importAllDataAction(fileContent);

      if (result.success) {
        toast({ title: "Migration Complete", description: result.message });
      } else {
        toast({ title: "Migration Failed", description: result.message, variant: "destructive" });
      }
    });
    // Reset file input to allow re-uploading the same file
    if (allDataFileInputRef.current) {
        allDataFileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input type="file" ref={allDataFileInputRef} onChange={handleAllDataFileChange} accept=".json" style={{ display: 'none' }} />

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
            <CardTitle>Data Migration</CardTitle>
            <CardDescription>
              Migrate data from another SCRBRD project by uploading an export file. 
              This process will add the data from your file to your existing project data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleImportAllClick} disabled={isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Migrate Data from File
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
