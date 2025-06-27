'use server';
/**
 * @fileOverview An AI flow to select the Player of the Match.
 *
 * - generatePlayerOfTheMatch - A function that analyzes a scorecard and returns the MVP.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InningsSchema, PlayerOfTheMatchSchema, type GenerateScorecardOutput, type PlayerOfTheMatchOutput } from '@/ai/schemas';

const PromptInputSchema = z.object({
  innings1: z.string().describe("A JSON string of the first innings scorecard."),
  innings2: z.string().describe("A JSON string of the second innings scorecard."),
});

const prompt = ai.definePrompt({
  name: 'generatePlayerOfTheMatchPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: PlayerOfTheMatchSchema },
  prompt: `You are an expert cricket analyst. Based on the complete scorecard JSON data for a T20 match, select the "Player of the Match".

Consider both batting and bowling performances. Look for game-changing contributions, such as a high score at a fast strike rate, a match-winning innings under pressure, or a devastating bowling spell that changed the course of the game.

The player can be from either the winning or losing team, but their performance must be exceptional.

In your justification, briefly state the key statistics that led to your decision (e.g., "...for their blistering 85 runs off just 45 balls..." or "...for a crucial spell of 4 wickets for 20 runs...").

Innings 1 Data:
{{{innings1}}}

Innings 2 Data:
{{{innings2}}}

Provide your response in the specified JSON format. Do not include any explanatory text.`,
});

const generatePlayerOfTheMatchFlow = ai.defineFlow(
  {
    name: 'generatePlayerOfTheMatchFlow',
    inputSchema: z.object({ innings1: InningsSchema, innings2: InningsSchema }),
    outputSchema: PlayerOfTheMatchSchema,
  },
  async (input) => {
    const promptInput = {
        innings1: JSON.stringify(input.innings1),
        innings2: JSON.stringify(input.innings2),
    }
    const { output } = await prompt(promptInput);
    return output!;
  }
);

export async function generatePlayerOfTheMatch(input: GenerateScorecardOutput): Promise<PlayerOfTheMatchOutput> {
    return generatePlayerOfTheMatchFlow(input);
}
