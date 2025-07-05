
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
    prompt: `You are an expert third umpire operating a high-tech ball-tracking and review system (DRS) for a cricket match. Your task is to review a Leg Before Wicket (LBW) appeal based on a short video or image provided, along with the match context.

The on-field umpire's original decision was: **{{{onFieldDecision}}}**

Context of the delivery:
- Bowler: **{{{bowlerHand}}}**
- Bowling Angle: **{{{bowlingAngle}}}**
- Batter: **{{{batterHand}}}**

Analyze the provided media to determine the three key components of an LBW decision. If the decision is marginal (within the margin of error for ball tracking), you must select "Umpire's Call".

1.  **Pitching**: Where did the ball pitch?
    - 'In-Line': Pitched within the line of the wickets.
    - 'Outside Off': Pitched outside the off stump.
    - 'Outside Leg': Pitched outside the leg stump. (This would result in a 'Not Out' decision).

2.  **Impact**: Where did the ball make contact with the batsman?
    - 'In-Line': Impact was in line with the wickets.
    - 'Outside Off': Impact was outside the line of off stump.
    - 'Too High': Impact was above the bails.

3.  **Wickets**: Was the ball's trajectory going on to hit the wickets?
    - 'Hitting': The ball was clearly going to hit the stumps.
    - 'Missing': The ball was clearly going to miss the stumps.
    - "Umpire's Call": The ball was projected to be clipping the edge of the stumps.

Based on your analysis of these three components and the original on-field decision, determine the **Final Decision** ('Out' or 'Not Out') and the **DRS Outcome** (e.g., "Original decision stands", "Decision Overturned").

Finally, provide a step-by-step **Justification** for your decision, explaining your reasoning for each of the three components.

Media of the appeal:
{{media url=mediaDataUri}}
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
