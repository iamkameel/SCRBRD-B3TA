'use client';

import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { createSummaryAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Match Summary'
      )}
    </Button>
  );
}

export function MatchForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: 'Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  return (
    <form action={createSummaryAction}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Enter Match Details</CardTitle>
          <CardDescription>
            Provide player statistics for both teams and key highlights to generate a match summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team1Name">Team 1 Name</Label>
                <Input
                  id="team1Name"
                  name="team1Name"
                  placeholder="e.g., Royal Challengers"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team1Stats">Team 1 Player Statistics</Label>
                <Textarea
                  id="team1Stats"
                  name="team1Stats"
                  placeholder="Player 1: 50 runs (30 balls), 2 wickets..."
                  className="min-h-[150px]"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team2Name">Team 2 Name</Label>
                <Input
                  id="team2Name"
                  name="team2Name"
                  placeholder="e.g., Mumbai Indians"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team2Stats">Team 2 Player Statistics</Label>
                <Textarea
                  id="team2Stats"
                  name="team2Stats"
                  placeholder="Player A: 80 runs (55 balls), 1 wicket..."
                  className="min-h-[150px]"
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyHighlights">Key Highlights</Label>
            <Textarea
              id="keyHighlights"
              name="keyHighlights"
              placeholder="e.g., A last-over thriller, a hat-trick in the 10th over, a record-breaking partnership..."
              className="min-h-[100px]"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
