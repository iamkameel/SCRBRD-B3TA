'use server';
/**
 * @fileOverview Match image generation flow.
 *
 * - generateMatchImage - A function that generates a match image based on team names.
 * - MatchImageInput - The input type for the generateMatchImage function.
 * - MatchImageOutput - The return type for the generateMatchImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchImageInputSchema = z.object({
  team1Name: z.string().describe('The name of the first team.'),
  team2Name: z.string().describe('The name of the second team.'),
});
export type MatchImageInput = z.infer<typeof MatchImageInputSchema>;

const MatchImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated match image.'),
});
export type MatchImageOutput = z.infer<typeof MatchImageOutputSchema>;

export async function generateMatchImage(input: MatchImageInput): Promise<MatchImageOutput> {
  return generateMatchImageFlow(input);
}

const generateMatchImageFlow = ai.defineFlow(
  {
    name: 'generateMatchImageFlow',
    inputSchema: MatchImageInputSchema,
    outputSchema: MatchImageOutputSchema,
  },
  async ({ team1Name, team2Name }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `An epic, high-action digital art illustration of a cricket match between ${team1Name} and ${team2Name}. The style should be dramatic and exciting, suitable for a sports website banner. Show a batsman hitting a powerful shot and a bowler in action. Include abstract representations of team colors if possible, but do not include any text or logos.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return an image.');
    }

    return { imageUrl: media.url };
  }
);
