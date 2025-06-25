'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="export">
          <AccordionTrigger>Export Data</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Download all your data as a JSON file.
              </p>
              <Button disabled>
                <Download className="mr-2" />
                Export All Data
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="import">
          <AccordionTrigger>Import Data</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Import data from a previously exported JSON file. This will overwrite existing data.
                </p>
                <Button variant="outline" disabled>
                    <Upload className="mr-2" />
                    Import Data
                </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="delete" className="border-b-0">
          <AccordionTrigger className="text-destructive hover:no-underline data-[state=open]:text-destructive">
            Danger Zone
          </AccordionTrigger>
          <AccordionContent>
             <div className="space-y-4 rounded-lg border border-destructive p-4">
                <h4 className="font-semibold">Clear All Data</h4>
                <p className="text-sm text-muted-foreground">
                    Permanently delete all your data. This action cannot be undone.
                </p>
                <Button variant="destructive" disabled>
                    <Trash2 className="mr-2" />
                    Delete All Data
                </Button>
             </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
