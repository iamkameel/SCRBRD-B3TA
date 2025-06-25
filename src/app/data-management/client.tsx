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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
                Download specific subsets of your data as JSON files.
              </p>
              <div className="space-y-2">
                {DATA_SUBSETS.map((subset) => (
                  <div key={`export-${subset}`} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium">{subset}</p>
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
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="import">
          <AccordionTrigger>Import Data</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Import data from a JSON file. This will overwrite existing data for that subset.
                </p>
                <div className="space-y-2">
                  {DATA_SUBSETS.map((subset) => (
                    <div key={`import-${subset}`} className="flex items-center justify-between rounded-lg border p-3">
                      <p className="font-medium">{subset}</p>
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
                    </div>
                  ))}
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="delete" className="border-b-0">
          <AccordionTrigger className="text-destructive hover:no-underline data-[state=open]:text-destructive">
            Danger Zone
          </AccordionTrigger>
          <AccordionContent>
             <div className="space-y-4 rounded-lg border border-destructive p-4">
                <h4 className="font-semibold">Clear Data Subsets</h4>
                <p className="text-sm text-muted-foreground">
                    Permanently delete specific subsets of your data. This action cannot be undone.
                </p>
                <div className="space-y-2">
                  {DATA_SUBSETS.map((subset) => (
                    <div key={`delete-${subset}`} className="flex items-center justify-between rounded-lg border border-destructive/50 p-3">
                      <p className="font-medium">{subset}</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" disabled>
                                <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Delete all {subset}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
             </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
