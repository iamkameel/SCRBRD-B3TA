'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2 } from "lucide-react";

export default function DataManagementClient() {
  return (
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
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download all your data as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>
            <Download className="mr-2" />
            Export All Data
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import data from a previously exported JSON file. This will overwrite existing data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Upload className="mr-2" />
            Import Data
          </Button>
        </CardContent>
      </Card>

       <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete all your data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            <Trash2 className="mr-2" />
            Delete All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
