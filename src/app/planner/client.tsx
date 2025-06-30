
'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns';
import { PlusCircle, Calendar, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TrainingSession, Team } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addSessionAction } from '@/lib/actions/sessions';
import { cn } from "@/lib/utils";

const FOCUS_AREAS = [
    { id: 'Batting', label: 'Batting' },
    { id: 'Bowling', label: 'Bowling' },
    { id: 'Fielding', label: 'Fielding' },
    { id: 'Fitness', label: 'Fitness' },
    { id: 'Tactical', label: 'Tactical' },
] as const;

const sessionFormSchema = z.object({
    title: z.string().min(1, { message: "Session title is required." }),
    date: z.date({ required_error: "A date is required." }),
    time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Please use HH:MM." }),
    focus: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one focus area.",
    }),
    notes: z.string().optional(),
});
type SessionFormValues = z.infer<typeof sessionFormSchema>;

function SessionDialog({ teamId, open, onOpenChange }: { teamId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionFormSchema),
        defaultValues: { title: "", time: "16:00", focus: [], notes: "" },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({ title: "", time: "16:00", focus: [], notes: "" });
        }
    }, [open, form]);

    function onSubmit(data: SessionFormValues) {
        startTransition(async () => {
            const [hours, minutes] = data.time.split(':').map(Number);
            const combinedDateTime = new Date(data.date);
            combinedDateTime.setHours(hours, minutes, 0, 0);

            try {
                await addSessionAction({
                    ...data,
                    date: combinedDateTime,
                    teamId,
                });
                toast({ title: "Session Created", description: "The new training session has been added to the planner." });
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not create session.", variant: "destructive" });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Training Session</DialogTitle>
                    <DialogDescription>Plan a new session for your team. Add drills and details later.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Session Title</FormLabel><FormControl><Input placeholder="e.g., Net Practice & Fielding Drills" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="time" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Time</FormLabel><FormControl><Input type="time" className="w-full" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="focus" render={() => (
                            <FormItem>
                                <FormLabel>Focus Areas</FormLabel>
                                <div className="grid grid-cols-2 gap-4">
                                {FOCUS_AREAS.map((item) => (
                                    <FormField key={item.id} control={form.control} name="focus" render={({ field }) => { return (
                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} /></FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )}} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any specific instructions or goals for this session..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Session"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PlannerClient({ sessions, team }: { sessions: TrainingSession[], team: Team | null }) {
    const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = React.useState(false);

    return (
        <>
        <div className="flex flex-col gap-8">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Session Planner</h1>
                <p className="text-muted-foreground">
                  {team ? `Planning for ${team.name}` : 'Create and manage your training sessions.'}
                </p>
              </div>
              {team && (
                <Button onClick={() => setIsAddSessionDialogOpen(true)}>
                    <PlusCircle className="mr-2" />Add Session
                </Button>
              )}
            </header>

            {!team && (
                 <Card>
                    <CardHeader>
                        <CardTitle>No Team Assigned</CardTitle>
                        <CardDescription>You must be assigned to a team as a coach to use the session planner.</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {team && sessions.length === 0 && (
                <Card>
                    <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-semibold">No Sessions Planned</p>
                        <p className="text-sm text-muted-foreground">Get started by creating your first training session.</p>
                    </CardContent>
                </Card>
            )}

            {team && sessions.length > 0 && (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <Card key={session.sessionId}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{session.title}</CardTitle>
                                        <CardDescription>{format(session.date, 'PPP, p')}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" disabled>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">Focus:</p>
                                    {session.focus.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
        {team && <SessionDialog teamId={team.teamId} open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen} />}
        </>
    );
}
