'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Users } from "lucide-react";
import { generateDreamTeam, type DreamTeamOutput } from '@/ai/flows/generate-dream-team-flow';

export function DreamTeamCard() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [dreamTeam, setDreamTeam] = React.useState<DreamTeamOutput | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setDreamTeam(null);
        try {
            const result = await generateDreamTeam();
            setDreamTeam(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({
                title: "Error Generating Team",
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
                        <CardTitle>AI Dream Team Selector</CardTitle>
                        <CardDescription>Let AI pick a top-performing T20 squad from your players.</CardDescription>
                    </div>
                     <Button onClick={handleGenerate} disabled={isGenerating} className="mt-4 md:mt-0">
                        <Wand2 className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? "Generating..." : "Generate Dream Team"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Analyzing player stats...</p>
                    </div>
                )}
                {!isGenerating && !dreamTeam && (
                     <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-4 font-semibold">Your Dream Team awaits</p>
                        <p className="text-sm text-muted-foreground">Click the button to generate a team based on player performance.</p>
                    </div>
                )}
                {dreamTeam && (
                    <div className="space-y-4">
                        {dreamTeam.team.map((player, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold">{player.name}</p>
                                    <p className="text-sm text-muted-foreground">{player.justification}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
