
'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, BrainCircuit, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StatsQueryCard } from './stats-query-card';
import { generateOppositionAnalysisAction } from '@/lib/actions/analysis';
import type { Team } from '@/lib/data';

const teamAnalysisSchema = z.object({
  teamId: z.string().min(1, { message: "Please select a team." }),
});
type TeamAnalysisFormValues = z.infer<typeof teamAnalysisSchema>;


function TeamAnalysisCard({ teams }: { teams: Team[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [analysis, setAnalysis] = React.useState<string | null>(null);

    const form = useForm<TeamAnalysisFormValues>({
        resolver: zodResolver(teamAnalysisSchema),
    });

    const selectedTeamId = form.watch('teamId');

    const handleGenerateAnalysis = () => {
        if (!selectedTeamId) return;
        setAnalysis(null); // Clear previous analysis
        startTransition(async () => {
            try {
                const result = await generateOppositionAnalysisAction(selectedTeamId);
                setAnalysis(result);
            } catch (error) {
                 toast({ title: "Error", description: error instanceof Error ? error.message : "Could not generate analysis.", variant: "destructive" });
            }
        });
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>AI Team Analysis</CardTitle>
                <CardDescription>Generate a strategic scouting report on any team in the league.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Select onValueChange={(value) => form.setValue('teamId', value)} value={selectedTeamId}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a team to analyze..." />
                        </SelectTrigger>
                        <SelectContent>
                            {teams.map(team => (
                                <SelectItem key={team.teamId} value={team.teamId}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateAnalysis} disabled={isPending || !selectedTeamId} className="w-full sm:w-auto">
                        <Wand2 className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        {isPending ? 'Analyzing...' : 'Generate Report'}
                    </Button>
                </div>
                
                {isPending && (
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 font-semibold">AI is analyzing team stats...</p>
                    </div>
                )}

                {!isPending && analysis && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-3 prose dark:prose-invert max-w-none">
                       <h3 className="flex items-center gap-2 not-prose"><BrainCircuit className="h-6 w-6 text-primary" />Scouting Report: {teams.find(t => t.teamId === selectedTeamId)?.name}</h3>
                       <div className="whitespace-pre-wrap">{analysis}</div>
                    </div>
                )}
                 {!isPending && !analysis && (
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                        <BrainCircuit className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-4 font-semibold">Select a team and click "Generate"</p>
                        <p className="text-sm text-muted-foreground">The AI scouting report will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AnalysisClient({ teams }: { teams: Team[] }) {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis Hub</h1>
                <p className="text-muted-foreground">Use AI-powered tools to query stats and analyze teams.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <StatsQueryCard />
                <TeamAnalysisCard teams={teams} />
            </div>
        </div>
    );
}
