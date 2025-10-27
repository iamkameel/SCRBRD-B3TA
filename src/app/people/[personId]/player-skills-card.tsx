
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const skillsSchema = z.object({
  batting: z.object({
    power: z.number().min(0).max(100).optional(),
    timing: z.number().min(0).max(100).optional(),
    running: z.number().min(0).max(100).optional(),
    defense: z.number().min(0).max(100).optional(),
    shotSelection: z.number().min(0).max(100).optional(),
  }).optional(),
  bowling: z.object({
    pace: z.number().min(0).max(100).optional(),
    spin: z.number().min(0).max(100).optional(),
    accuracy: z.number().min(0).max(100).optional(),
    variation: z.number().min(0).max(100).optional(),
  }).optional(),
  fielding: z.object({
    catching: z.number().min(0).max(100).optional(),
    throwing: z.number().min(0).max(100).optional(),
    agility: z.number().min(0).max(100).optional(),
    groundFielding: z.number().min(0).max(100).optional(),
  }).optional(),
  wicketkeeping: z.object({
    glovework: z.number().min(0).max(100).optional(),
    footwork: z.number().min(0).max(100).optional(),
    anticipation: z.number().min(0).max(100).optional(),
  }).optional(),
  mental: z.object({
    composure: z.number().min(0).max(100).optional(),
    resilience: z.number().min(0).max(100).optional(),
    coachability: z.number().min(0).max(100).optional(),
    leadership: z.number().min(0).max(100).optional(),
  }).optional(),
  tactical: z.object({
    situationalAwareness: z.number().min(0).max(100).optional(),
    planExecution: z.number().min(0).max(100).optional(),
  }).optional(),
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
                            defaultValue={[field.value ?? 50]}
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
    const isWicketKeeper = person.roles.includes('Wicket-Keeper');

    const form = useForm<SkillsFormValues>({
        resolver: zodResolver(skillsSchema),
        defaultValues: {
            batting: person.skills?.batting || { power: 50, timing: 50, running: 50, defense: 50, shotSelection: 50 },
            bowling: person.skills?.bowling || { pace: 50, spin: 50, accuracy: 50, variation: 50 },
            fielding: person.skills?.fielding || { catching: 50, throwing: 50, agility: 50, groundFielding: 50 },
            wicketkeeping: person.skills?.wicketkeeping || { glovework: 50, footwork: 50, anticipation: 50 },
            mental: person.skills?.mental || { composure: 50, resilience: 50, coachability: 50, leadership: 50 },
            tactical: person.skills?.tactical || { situationalAwareness: 50, planExecution: 50 },
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Batting</h3>
                        <SkillDisplay label="Power Hitting" value={skills.batting?.power} />
                        <SkillDisplay label="Timing & Placement" value={skills.batting?.timing} />
                        <SkillDisplay label="Running Between Wickets" value={skills.batting?.running} />
                        <SkillDisplay label="Defense & Leaving" value={skills.batting?.defense} />
                        <SkillDisplay label="Shot Selection" value={skills.batting?.shotSelection} />
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Bowling</h3>
                        <SkillDisplay label="Pace" value={skills.bowling?.pace} />
                        <SkillDisplay label="Spin / Variation" value={skills.bowling?.spin} />
                        <SkillDisplay label="Accuracy" value={skills.bowling?.accuracy} />
                        <SkillDisplay label="Control of Variations" value={skills.bowling?.variation} />
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Fielding</h3>
                        <SkillDisplay label="Catching" value={skills.fielding?.catching} />
                        <SkillDisplay label="Throwing Accuracy" value={skills.fielding?.throwing} />
                        <SkillDisplay label="Agility / Speed" value={skills.fielding?.agility} />
                        <SkillDisplay label="Ground Fielding" value={skills.fielding?.groundFielding} />
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
                        <Tabs defaultValue="batting">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="batting">Batting</TabsTrigger>
                                <TabsTrigger value="bowling">Bowling</TabsTrigger>
                                <TabsTrigger value="fielding">Fielding</TabsTrigger>
                                {isWicketKeeper && <TabsTrigger value="wicketkeeping">Keeping</TabsTrigger>}
                                <TabsTrigger value="mental">Mental</TabsTrigger>
                                <TabsTrigger value="tactical">Tactical</TabsTrigger>
                            </TabsList>
                            <TabsContent value="batting" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <SkillSlider form={form} name="batting.power" label="Power Hitting" />
                                <SkillSlider form={form} name="batting.timing" label="Timing & Placement" />
                                <SkillSlider form={form} name="batting.running" label="Running Between Wickets" />
                                <SkillSlider form={form} name="batting.defense" label="Defense & Leaving" />
                                <SkillSlider form={form} name="batting.shotSelection" label="Shot Selection vs. Format" />
                            </TabsContent>
                            <TabsContent value="bowling" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <SkillSlider form={form} name="bowling.pace" label="Raw Pace" />
                                <SkillSlider form={form} name="bowling.spin" label="Spin / Drift" />
                                <SkillSlider form={form} name="bowling.accuracy" label="Line & Length Accuracy" />
                                <SkillSlider form={form} name="bowling.variation" label="Control of Variations" />
                            </TabsContent>
                             <TabsContent value="fielding" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <SkillSlider form={form} name="fielding.catching" label="Catching (Outfield)" />
                                <SkillSlider form={form} name="fielding.throwing" label="Throwing Accuracy & Power" />
                                <SkillSlider form={form} name="fielding.agility" label="Agility / Speed" />
                                <SkillSlider form={form} name="fielding.groundFielding" label="Ground Fielding" />
                            </TabsContent>
                            {isWicketKeeper && (
                                <TabsContent value="wicketkeeping" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <SkillSlider form={form} name="wicketkeeping.glovework" label="Glovework" />
                                    <SkillSlider form={form} name="wicketkeeping.footwork" label="Footwork" />
                                    <SkillSlider form={form} name="wicketkeeping.anticipation" label="Anticipation / Reading" />
                                </TabsContent>
                            )}
                            <TabsContent value="mental" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <SkillSlider form={form} name="mental.composure" label="Composure Under Pressure" />
                                <SkillSlider form={form} name="mental.resilience" label="Resilience / Bounce-back" />
                                <SkillSlider form={form} name="mental.coachability" label="Coachability" />
                                <SkillSlider form={form} name="mental.leadership" label="Leadership Potential" />
                            </TabsContent>
                            <TabsContent value="tactical" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <SkillSlider form={form} name="tactical.situationalAwareness" label="Situational Awareness" />
                                <SkillSlider form={form} name="tactical.planExecution" label="Plan Execution" />
                            </TabsContent>
                        </Tabs>

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
