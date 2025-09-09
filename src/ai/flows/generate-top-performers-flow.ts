'use server';
/**
 * @fileOverview An AI flow to select the top 4 performers of a match.
 *
 * - getTopPerformers - A function that analyzes a scorecard and returns the top 4 performers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InningsSchema, TopPerformersOutputSchema, type GenerateScorecardOutput, type TopPerformersOutput } from '@/ai/schemas';

const PromptInputSchema = z.object({
  innings1: z.string().describe("A JSON string of the first innings scorecard."),
  innings2: z.string().describe("A JSON string of the second innings scorecard."),
});

const prompt = ai.definePrompt({
  name: 'generateTopPerformersPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: TopPerformersOutputSchema },
  prompt: `You are an expert cricket analyst. Based on the complete scorecard JSON data for a T20 match, select the top 4 performers of the match. These will be presented to a user to select the final "Player of the Match".

For each of the 4 players, provide their full name, team name, and a short justification for their selection, highlighting their key statistics (e.g., "78 runs off 45 balls" or "a crucial spell of 4 for 25").

The players can be from either the winning or losing team, but their performances must be exceptional and impactful.

Innings 1 Data:
{{{innings1}}}

Innings 2 Data:
{{{innings2}}}

Provide your response in the specified JSON format. Do not include any explanatory text.`,
});

const generateTopPerformersFlow = ai.defineFlow(
  {
    name: 'generateTopPerformersFlow',
    inputSchema: z.object({ innings1: InningsSchema, innings2: InningsSchema }),
    outputSchema: TopPerformersOutputSchema,
  },
  async (input) => {
    const promptInput = {
        innings1: JSON.stringify(input.innings1, null, 2),
        innings2: JSON.stringify(input.innings2, null, 2),
    }
    const { output } = await prompt(promptInput);
    if (!output) {
      throw new Error("Failed to generate top performers.");
    }
    return output;
  }
);

export async function getTopPerformers(input: GenerateScorecardOutput): Promise<TopPerformersOutput> {
    return generateTopPerformersFlow(input);
}

// Legacy export for backward compatibility where only one player was expected.
// New code should use getTopPerformers.
export const generatePlayerOfTheMatch = ai.defineFlow(
  {
    name: 'generatePlayerOfTheMatchFlow',
    inputSchema: z.object({ innings1: InningsSchema, innings2: InningsSchema }),
    outputSchema: TopPerformersOutputSchema,
  },
  async (input) => {
    return generateTopPerformersFlow(input);
  }
);
