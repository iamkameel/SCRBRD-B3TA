'use server';
/**
 * @fileOverview An AI flow to simulate an umpire's decision review.
 * 
 * - runUmpireReview - A function that handles the umpire review process.
 */

import { ai } from '@/ai/genkit';
import { UmpireReviewInputSchema, UmpireDecisionSchema, type UmpireReviewInput, type UmpireDecisionOutput } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'umpireReviewPrompt',
    input: { schema: UmpireReviewInputSchema },
    output: { schema: UmpireDecisionSchema },
    prompt: `You are an expert third umpire operating a high-tech ball-tracking system for a cricket match. Your task is to review a Leg Before Wicket (LBW) appeal based on a single image provided.

From this single image, you must infer the most probable trajectory of the ball just before, during, and after the moment captured. Analyze the image to determine the three key components of an LBW decision:

1.  **Pitching**: Where did the ball pitch? 'In-Line' with the wickets, 'Outside Leg', or 'Outside Off'?
2.  **Impact**: Where did the ball make contact with the batsman? 'In-Line', 'Outside Leg', 'Outside Off', or was the impact 'Too High'?
3.  **Wickets**: Was the ball's trajectory going on to hit the wickets? Your options are 'Hitting', 'Missing', or if it is too close to call from the image, select "Umpire's Call".

Based on your analysis of these three components, make a final **Decision** ('Out', 'Not Out', or "Umpire's Call").

Finally, provide a step-by-step **Justification** for your decision, explaining your reasoning for each of the three components.

Image of the appeal:
{{media url=photoDataUri}}
`,
});

const umpireReviewFlow = ai.defineFlow(
    {
        name: 'umpireReviewFlow',
        inputSchema: UmpireReviewInputSchema,
        outputSchema: UmpireDecisionSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function runUmpireReview(input: UmpireReviewInput): Promise<UmpireDecisionOutput> {
    return umpireReviewFlow(input);
}
