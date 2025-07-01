
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ScoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScore: (event: { event: string; runs?: number }) => void;
}

export function ScoringDialog({ open, onOpenChange, onScore }: ScoringDialogProps) {
  const handleSelect = (event: string, runs?: number) => {
    onScore({ event, runs });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Delivery</DialogTitle>
          <DialogDescription>
            Select the outcome of the ball after tapping the field location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Runs Scored</h4>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => handleSelect('.', 0)}>0</Button>
              {[1, 2, 3, 4, 5, 6].map((run) => (
                <Button key={run} variant="outline" onClick={() => handleSelect(run.toString(), run)}>
                  {run}
                </Button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
             <Button variant="destructive" className="w-full" onClick={() => handleSelect('W')}>Wicket</Button>
             <div className="contents">
                <Button variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 w-full" onClick={() => handleSelect('wd')}>Wide</Button>
                <Button variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 w-full" onClick={() => handleSelect('nb')}>No Ball</Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
