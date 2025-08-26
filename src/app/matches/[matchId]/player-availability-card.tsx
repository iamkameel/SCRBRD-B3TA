'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updatePlayerAvailabilityAction } from '@/lib/actions/matches';
import type { Match, AvailabilityStatus } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PlayerAvailabilityCard({ match }: { match: Match }) {
    const { person } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [note, setNote] = React.useState('');

    if (!person) return null;

    const currentAvailability = match.availability?.[person.personId];

    React.useEffect(() => {
        if (currentAvailability?.note) {
            setNote(currentAvailability.note);
        }
    }, [currentAvailability]);

    const handleStatusChange = (status: AvailabilityStatus) => {
        startTransition(async () => {
            try {
                await updatePlayerAvailabilityAction(match.matchId, status, note);
                toast({ title: "Availability Updated" });
            } catch (error) {
                 toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update availability.", variant: "destructive" });
            }
        });
    };

    const handleNoteBlur = () => {
        // Only update if there's a status already set
        if(currentAvailability?.status) {
            handleStatusChange(currentAvailability.status);
        }
    }
    
    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">Set Your Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup 
                    defaultValue={currentAvailability?.status} 
                    onValueChange={(value) => handleStatusChange(value as AvailabilityStatus)}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    disabled={isPending}
                >
                    <div><RadioGroupItem value="attending" id="attending" className="peer sr-only" /><Label htmlFor="attending" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Attending</Label></div>
                    <div><RadioGroupItem value="unavailable" id="unavailable" className="peer sr-only" /><Label htmlFor="unavailable" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Unavailable</Label></div>
                    <div><RadioGroupItem value="tentative" id="tentative" className="peer sr-only" /><Label htmlFor="tentative" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Maybe</Label></div>
                     <div><RadioGroupItem value="injured" id="injured" className="peer sr-only" /><Label htmlFor="injured" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Injured</Label></div>
                </RadioGroup>
                <div className="space-y-2">
                    <Label htmlFor="availability-note">Note (Optional)</Label>
                    <Textarea 
                        id="availability-note" 
                        placeholder="e.g., Will be 15 minutes late" 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={handleNoteBlur}
                        disabled={isPending}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
