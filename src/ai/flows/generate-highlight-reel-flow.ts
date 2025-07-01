'use server';
/**
 * @fileOverview An AI flow to generate a highlight reel from a match scorecard.
 *
 * - generateHighlightReel - A function that analyzes a scorecard to identify key moments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateMatchReportInputSchema, HighlightReelSchema, type HighlightReelOutput, type GenerateMatchReportInput } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'generateHighlightReelPrompt',
    input: { schema: GenerateMatchReportInputSchema },
    output: { schema: HighlightReelSchema },
    prompt: `You are an expert cricket commentator and video editor. Your task is to analyze the provided T20 match scorecard JSON data and identify the most exciting and pivotal moments to create a highlight reel.

Focus on:
- Key wickets, especially of top-order batsmen or at critical moments.
- Rapid scoring, like multiple boundaries in an over.
- Player milestones (reaching 50 or 100).
- Turning points in the match.
- Tense moments during the final overs of a close run chase.

For each highlight, provide the over it occurred in and a short, punchy, one-sentence description suitable for a highlight package. Select between 5 to 8 key moments.

Innings 1 Data ({{{teamAName}}} vs {{{teamBName}}}):
{{{json innings1}}}

Innings 2 Data ({{{teamAName}}} vs {{{teamBName}}}):
{{{json innings2}}}

Return your response in the specified JSON format.
`,
});

const generateHighlightReelFlow = ai.defineFlow(
  {
    name: 'generateHighlightReelFlow',
    inputSchema: GenerateMatchReportInputSchema,
    outputSchema: HighlightReelSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateHighlightReel(input: GenerateMatchReportInput): Promise<HighlightReelOutput> {
    return generateHighlightReelFlow(input);
}
