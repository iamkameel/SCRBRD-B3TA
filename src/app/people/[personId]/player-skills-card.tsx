
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
import type { Person, PersonSkills, TechnicalSkills, MentalSkills, PhysicalSkills } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const skillDetailSchema = z.object({}).catchall(z.number().min(1).max(20));

const skillsSchema = z.object({
  technical: z.object({
    batting: skillDetailSchema.optional(),
    bowling: skillDetailSchema.optional(),
    fielding: skillDetailSchema.optional(),
  }),
  mental: skillDetailSchema,
  physical: skillDetailSchema,
});

type SkillsFormValues = z.infer<typeof skillsSchema>;

interface PlayerSkillsCardProps {
  person: Person;
  canManage: boolean;
}

const SkillSlider = ({ form, name, label }: { form: any; name: string; label: string }) => {
    const value = form.watch(name);
    return (
        <FormItem>
            <div className="flex justify-between items-center mb-2">
                <FormLabel>{label}</FormLabel>
                <span className="text-sm font-medium text-primary w-10 text-right">{value}</span>
            </div>
            <FormControl>
                <Slider
                    onValueChange={(value) => form.setValue(name, value[0], { shouldDirty: true })}
                    defaultValue={[value ?? 10]}
                    max={20}
                    step={1}
                />
            </FormControl>
        </FormItem>
    );
};

const SkillCategoryCard = ({ title, skills, attributeMap }: { title: string, skills: any, attributeMap: { key: string, label: string }[] }) => (
    <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            {attributeMap.map(attr => (
                <div key={attr.key} className="flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">{attr.label}</p>
                    <p className="font-semibold">{skills?.[attr.key] ?? '-'}</p>
                </div>
            ))}
        </CardContent>
    </Card>
)

const technicalBattingMap = [
    { key: 'timing', label: 'Timing' }, { key: 'shotSelection', label: 'Shot Selection' }, { key: 'defense', label: 'Defense' },
    { key: 'powerHitting', label: 'Power Hitting' }, { key: 'footwork', label: 'Footwork' }, { key: 'playingSpin', label: 'Playing Spin' },
    { key: 'runningBetweenWickets', label: 'Running Between Wickets' }, { key: 'concentration', label: 'Concentration' }, { key: 'patience', label: 'Patience' },
];
const technicalBowlingMap = [
    { key: 'paceSpeed', label: 'Pace/Speed' }, { key: 'accuracy', label: 'Accuracy' }, { key: 'spinVariation', label: 'Spin/Variation' },
    { key: 'controlOfVariations', label: 'Control of Variations' }, { key: 'movement', label: 'Movement (Swing/Seam)' }, { key: 'bouncerShortBall', label: 'Bouncer/Short Ball' },
    { key: 'staminaWorkload', label: 'Stamina/Workload' }, { key: 'openingSpellImpact', label: 'Opening Spell Impact' }, { key: 'deathPowerplaySkills', label: 'Death/Powerplay Skills' },
];
const technicalFieldingMap = [
    { key: 'agilitySpeed', label: 'Agility/Speed' }, { key: 'catchingClose', label: 'Catching (Close)' }, { key: 'catchingOutfield', label: 'Catching (Outfield)' },
    { key: 'throwingAccuracy', label: 'Throwing Accuracy' }, { key: 'throwingPower', label: 'Throwing Power' }, { key: 'groundFielding', label: 'Ground Fielding' },
    { key: 'reflexes', label: 'Reflexes' }, { key: 'stumpingRunOuts', label: 'Stumping/Run-Outs' }, { key: 'gatheringCollecting', label: 'Gathering/Collecting' },
];
const mentalMap = [
    { key: 'composure', label: 'Composure' }, { key: 'aggression', label: 'Aggression' }, { key: 'anticipation', label: 'Anticipation' },
    { key: 'determination', label: 'Determination' }, { key: 'concentration', label: 'Concentration' }, { key: 'decisions', label: 'Decisions' },
    { key: 'bravery', label: 'Bravery' }, { key: 'leadership', label: 'Leadership' }, { key: 'teamwork', label: 'Teamwork' }, { key: 'workRate', label: 'Work Rate' },
];
const physicalMap = [
    { key: 'pace', label: 'Pace' }, { key: 'acceleration', label: 'Acceleration' }, { key: 'agility', label: 'Agility' },
    { key: 'stamina', label: 'Stamina' }, { key: 'strength', label: 'Strength' }, { key: 'balance', label: 'Balance' },
    { key: 'naturalFitness', label: 'Natural Fitness' }, { key: 'jumpingReach', label: 'Jumping Reach' },
];


export function PlayerSkillsCard({ person, canManage }: PlayerSkillsCardProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const isWicketKeeper = person.roles.includes('Wicket-Keeper');

    const form = useForm<SkillsFormValues>({
        resolver: zodResolver(skillsSchema),
        defaultValues: person.skills || {
            technical: {
                batting: Object.fromEntries(technicalBattingMap.map(a => [a.key, 10])),
                bowling: Object.fromEntries(technicalBowlingMap.map(a => [a.key, 10])),
                fielding: Object.fromEntries(technicalFieldingMap.map(a => [a.key, 10])),
            },
            mental: Object.fromEntries(mentalMap.map(a => [a.key, 10])),
            physical: Object.fromEntries(physicalMap.map(a => [a.key, 10])),
        }
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
        const skills = person.skills;
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Player Skills & Attributes</CardTitle>
                    <CardDescription>A coach-rated overview of this player's abilities on a scale of 1-20.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="technical">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                            <TabsTrigger value="mental">Mental</TabsTrigger>
                            <TabsTrigger value="physical">Physical</TabsTrigger>
                        </TabsList>
                        <TabsContent value="technical" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <SkillCategoryCard title="Batting" skills={skills?.technical?.batting} attributeMap={technicalBattingMap} />
                           <SkillCategoryCard title="Bowling" skills={skills?.technical?.bowling} attributeMap={technicalBowlingMap} />
                           <SkillCategoryCard title="Fielding/Keeping" skills={skills?.technical?.fielding} attributeMap={technicalFieldingMap} />
                        </TabsContent>
                         <TabsContent value="mental" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <SkillCategoryCard title="Mental" skills={skills?.mental} attributeMap={mentalMap} />
                        </TabsContent>
                         <TabsContent value="physical" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <SkillCategoryCard title="Physical" skills={skills?.physical} attributeMap={physicalMap} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Player Skills & Attributes</CardTitle>
                <CardDescription>Rate the player's core attributes on a scale of 1 to 20. These are visible to coaches and admins.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Tabs defaultValue="technical">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="technical">Technical</TabsTrigger>
                                <TabsTrigger value="mental">Mental</TabsTrigger>
                                <TabsTrigger value="physical">Physical</TabsTrigger>
                            </TabsList>
                            <TabsContent value="technical" className="pt-4 space-y-6">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-4">Batting</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {technicalBattingMap.map(attr => <SkillSlider key={attr.key} form={form} name={`technical.batting.${attr.key}`} label={attr.label} />)}
                                    </div>
                                </div>
                                 <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-4">Bowling</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                         {technicalBowlingMap.map(attr => <SkillSlider key={attr.key} form={form} name={`technical.bowling.${attr.key}`} label={attr.label} />)}
                                    </div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-4">Fielding & Wicketkeeping</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                         {technicalFieldingMap.map(attr => <SkillSlider key={attr.key} form={form} name={`technical.fielding.${attr.key}`} label={attr.label} />)}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="mental" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {mentalMap.map(attr => <SkillSlider key={attr.key} form={form} name={`mental.${attr.key}`} label={attr.label} />)}
                            </TabsContent>
                             <TabsContent value="physical" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {physicalMap.map(attr => <SkillSlider key={attr.key} form={form} name={`physical.${attr.key}`} label={attr.label} />)}
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
