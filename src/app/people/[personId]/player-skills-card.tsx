
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { updatePlayerSkillsAction } from '@/lib/actions/players';
import type { Person, PersonSkills } from '@/lib/data';
import { Loader2 } from 'lucide-react';

const skillsSchema = z.object({
  batting: z.object({
    power: z.number().min(0).max(100),
    timing: z.number().min(0).max(100),
    running: z.number().min(0).max(100),
  }),
  bowling: z.object({
    pace: z.number().min(0).max(100),
    spin: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
  }),
  fielding: z.object({
    catching: z.number().min(0).max(100),
    throwing: z.number().min(0).max(100),
    agility: z.number().min(0).max(100),
  }),
});

type SkillsFormValues = z.infer<typeof skillsSchema>;

interface PlayerSkillsCardProps {
  person: Person;
  canManage: boolean;
}

const SkillSlider = ({ form, name, label }: { form: any; name: string; label: string }) => {
    const value = form.watch(name);
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>{label}</FormLabel>
                        <span className="text-sm font-medium text-primary w-10 text-right">{field.value}</span>
                    </div>
                    <FormControl>
                        <Slider
                            onValueChange={(value) => field.onChange(value[0])}
                            defaultValue={[field.value ?? 0]}
                            max={100}
                            step={1}
                        />
                    </FormControl>
                </FormItem>
            )}
        />
    );
};

export function PlayerSkillsCard({ person, canManage }: PlayerSkillsCardProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<SkillsFormValues>({
        resolver: zodResolver(skillsSchema),
        defaultValues: {
            batting: {
                power: person.skills?.batting?.power || 50,
                timing: person.skills?.batting?.timing || 50,
                running: person.skills?.batting?.running || 50,
            },
            bowling: {
                pace: person.skills?.bowling?.pace || 50,
                spin: person.skills?.bowling?.spin || 50,
                accuracy: person.skills?.bowling?.accuracy || 50,
            },
            fielding: {
                catching: person.skills?.fielding?.catching || 50,
                throwing: person.skills?.fielding?.throwing || 50,
                agility: person.skills?.fielding?.agility || 50,
            },
        },
    });

    const onSubmit = (data: SkillsFormValues) => {
        startTransition(async () => {
            try {
                await updatePlayerSkillsAction(person.personId, data);
                toast({ title: "Skills Updated", description: "The player's new skill ratings have been saved." });
            } catch (error) {
                toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save skills.", variant: "destructive" });
            }
        });
    };

    if (!canManage) {
        // Read-only view
        const skills = person.skills || {};
        const SkillDisplay = ({ label, value }: {label: string, value?: number}) => (
            <div className="flex justify-between items-center text-sm">
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold">{value ?? '-'}</p>
            </div>
        )
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Player Skills &amp; Attributes</CardTitle>
                    <CardDescription>A coach-rated overview of this player's abilities.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Batting</h3>
                        <SkillDisplay label="Power" value={skills.batting?.power} />
                        <SkillDisplay label="Timing" value={skills.batting?.timing} />
                        <SkillDisplay label="Running" value={skills.batting?.running} />
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Bowling</h3>
                        <SkillDisplay label="Pace" value={skills.bowling?.pace} />
                        <SkillDisplay label="Spin" value={skills.bowling?.spin} />
                        <SkillDisplay label="Accuracy" value={skills.bowling?.accuracy} />
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Fielding</h3>
                        <SkillDisplay label="Catching" value={skills.fielding?.catching} />
                        <SkillDisplay label="Throwing" value={skills.fielding?.throwing} />
                        <SkillDisplay label="Agility" value={skills.fielding?.agility} />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Player Skills &amp; Attributes</CardTitle>
                <CardDescription>Rate the player's core skills. These attributes are visible to coaches and admins.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">Batting</h3>
                                <SkillSlider form={form} name="batting.power" label="Power Hitting" />
                                <SkillSlider form={form} name="batting.timing" label="Timing" />
                                <SkillSlider form={form} name="batting.running" label="Running Between Wickets" />
                            </div>
                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">Bowling</h3>
                                <SkillSlider form={form} name="bowling.pace" label="Pace" />
                                <SkillSlider form={form} name="bowling.spin" label="Spin / Variation" />
                                <SkillSlider form={form} name="bowling.accuracy" label="Accuracy" />
                            </div>
                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">Fielding</h3>
                                <SkillSlider form={form} name="fielding.catching" label="Catching" />
                                <SkillSlider form={form} name="fielding.throwing" label="Throwing Accuracy" />
                                <SkillSlider form={form} name="fielding.agility" label="Agility / Speed" />
                            </div>
                        </div>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Saving..." : "Save Skills"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
