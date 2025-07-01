
'use server';
/**
 * @fileOverview An AI flow to generate a scouting report for a player from a photo.
 *
 * - scoutPlayer - A function that handles the player scouting process.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ScoutingReportInputSchema, ScoutingReportSchema, type ScoutingReportOutput, type ScoutingReportInput } from '@/ai/schemas';

const prompt = ai.definePrompt({
    name: 'scoutPlayerPrompt',
    input: { schema: ScoutingReportInputSchema },
    output: { schema: ScoutingReportSchema },
    prompt: `You are an world-class cricket talent scout and technical coach. Your task is to analyze a single photo of a young cricketer, {{{playerName}}}, to provide a preliminary scouting report.

The image provided captures a key moment of them performing their primary skill: **{{{skill}}}**.

Based on this single image, analyze their technique.
- For **Batting**, focus on their stance, grip, head position, balance, and backlift.
- For **Bowling**, focus on their run-up posture, bowling action (front-on, side-on, mixed), arm position, and release point.

Your analysis should be insightful but acknowledge the limitations of a single photo.

Your output must be in the specified JSON format and include:
1.  **strengths**: 2-3 positive technical attributes you can infer from the image.
2.  **areasForImprovement**: 2-3 potential areas for technical refinement.
3.  **professionalComparison**: A comparison to a well-known professional cricketer with a similar style, explaining the reasoning.
4.  **summary**: A concise, one-paragraph summary of the player's technical profile and potential.

Image of the player:
{{media url=photoDataUri}}
`,
});

const scoutPlayerFlow = ai.defineFlow(
    {
        name: 'scoutPlayerFlow',
        inputSchema: ScoutingReportInputSchema,
        outputSchema: ScoutingReportSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

export async function scoutPlayer(input: ScoutingReportInput): Promise<ScoutingReportOutput> {
    return scoutPlayerFlow(input);
}
