
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
import type { RosterMemberWithStats } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type DismissalType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket';
const DISMISSAL_TYPES: DismissalType[] = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'];

interface ScoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScore: (event: { event: string; runs?: number, dismissal?: { type: DismissalType, fielderIds?: string[] } }) => void;
  bowlingTeamRoster: RosterMemberWithStats[];
}

export function ScoringDialog({ open, onOpenChange, onScore, bowlingTeamRoster }: ScoringDialogProps) {
  const [view, setView] = React.useState<'runs' | 'wicket'>('runs');
  const [dismissalType, setDismissalType] = React.useState<DismissalType | null>(null);
  const [fielderId, setFielderId] = React.useState<string | undefined>(undefined);
  
  React.useEffect(() => {
      // Reset state when dialog is re-opened
      if (open) {
          setView('runs');
          setDismissalType(null);
          setFielderId(undefined);
      }
  }, [open]);

  const handleSelect = (event: string, runs?: number) => {
    onScore({ event, runs });
    onOpenChange(false);
  };
  
  const handleWicketTypeSelect = (type: DismissalType) => {
      setDismissalType(type);
      if (type === 'Bowled' || type === 'LBW' || type === 'Hit Wicket') {
          // These dismissals don't involve fielders, so we can score immediately.
          onScore({ event: 'W', dismissal: { type } });
          onOpenChange(false);
      }
  };

  const handleFielderSelect = (fielderId: string) => {
      setFielderId(fielderId);
  }

  const confirmWicket = () => {
      if (dismissalType) {
          onScore({ event: 'W', dismissal: { type: dismissalType, fielderIds: fielderId ? [fielderId] : undefined } });
          onOpenChange(false);
      }
  }

  const needsFielder = dismissalType === 'Caught' || dismissalType === 'Run Out' || dismissalType === 'Stumped';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{view === 'runs' ? 'Record Delivery' : 'Record Wicket'}</DialogTitle>
          <DialogDescription>
            {view === 'runs' 
                ? "Select the outcome of the ball after tapping the field location."
                : `How was the batsman dismissed?`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {view === 'runs' && (
            <>
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
                 <Button variant="destructive" className="w-full" onClick={() => setView('wicket')}>Wicket</Button>
                 <div className="contents">
                    <Button variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 w-full" onClick={() => handleSelect('wd')}>Wide</Button>
                    <Button variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 w-full" onClick={() => handleSelect('nb')}>No Ball</Button>
                 </div>
              </div>
            </>
          )}
          {view === 'wicket' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                  {DISMISSAL_TYPES.map(type => (
                      <Button key={type} variant={dismissalType === type ? "secondary" : "outline"} onClick={() => handleWicketTypeSelect(type)}>{type}</Button>
                  ))}
              </div>
              
              {needsFielder && (
                <div className="space-y-2 pt-4">
                  <Separator />
                  <Label>Fielder</Label>
                  <Select onValueChange={handleFielderSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select fielder..." />
                    </SelectTrigger>
                    <SelectContent>
                        {bowlingTeamRoster.map(player => (
                            <SelectItem key={player.personId} value={player.personId}>{player.personName}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsFielder && (
                <Button onClick={confirmWicket} className="w-full" disabled={!fielderId}>Confirm Wicket</Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
