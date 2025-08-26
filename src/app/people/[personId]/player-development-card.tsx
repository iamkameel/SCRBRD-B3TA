'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { generatePlayerDevelopmentPlanAction } from '@/lib/actions/players';
import type { PlayerDevelopmentPlanOutput } from '@/ai/schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

export function PlayerDevelopmentCard({ personId, initialPlan, initialPlanDate }: { personId: string, initialPlan: PlayerDevelopmentPlanOutput | null, initialPlanDate?: Date }) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [plan, setPlan] = React.useState<PlayerDevelopmentPlanOutput | null>(initialPlan);
    const [planDate, setPlanDate] = React.useState<Date | undefined>(initialPlanDate);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setPlan(null);
        try {
            const result = await generatePlayerDevelopmentPlanAction(personId);
            setPlan(result);
            setPlanDate(new Date());
            toast({
                title: "Development Plan Generated",
                description: "The AI has analyzed the player's performance.",
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({
                title: "Error Generating Plan",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>AI Player Development Plan</CardTitle>
                        <CardDescription>Generate a personalized coaching plan based on stats and recent form.</CardDescription>
                        {plan && planDate && (
                            <p className="text-xs text-muted-foreground mt-1">Last generated: {format(planDate, 'PPP, p')}</p>
                        )}
                    </div>
                     <Button onClick={handleGenerate} disabled={isGenerating} className="mt-4 md:mt-0">
                        <Wand2 className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? "Analyzing Performance..." : (plan ? "Regenerate Plan" : "Generate Plan")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">The AI coach is reviewing the data...</p>
                    </div>
                )}
                {!isGenerating && !plan && (
                     <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                        <Target className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-4 font-semibold">Unlock Player Potential</p>
                        <p className="text-sm text-muted-foreground">Click the button to generate a custom development plan.</p>
                    </div>
                )}
                {plan && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><CheckCircle className="text-green-500" />Strengths</h3>
                                <ul className="space-y-1">
                                    {plan.strengths.map((item, index) => <li key={index} className="flex items-start gap-2"><Badge variant="secondary" className="mt-1">✓</Badge><span className="text-muted-foreground">{item}</span></li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><AlertTriangle className="text-yellow-500" />Areas for Improvement</h3>
                                <ul className="space-y-1">
                                    {plan.weaknesses.map((item, index) => <li key={index} className="flex items-start gap-2"><Badge variant="outline" className="mt-1">!</Badge><span className="text-muted-foreground">{item}</span></li>)}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Recommended Drills &amp; Focus</h3>
                             <Accordion type="single" collapsible className="w-full">
                                {plan.recommendations.map((rec, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger>
                                            <Link href={`/drills#${rec.drillId}`} className="hover:underline">
                                                {rec.drillName}
                                            </Link>
                                        </AccordionTrigger>
                                        <AccordionContent className="whitespace-pre-wrap">{rec.justification}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}