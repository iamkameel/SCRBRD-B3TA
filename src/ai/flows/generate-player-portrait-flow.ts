'use server';
/**
 * @fileOverview An AI flow to generate a unique player portrait.
 *
 * - generatePlayerPortrait - A function that generates an image for a person.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerPortraitInputSchema = z.object({
  firstName: z.string().describe('The first name of the person.'),
  lastName: z.string().describe('The last name of the person.'),
});
export type PlayerPortraitInput = z.infer<typeof PlayerPortraitInputSchema>;

const PlayerPortraitOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type PlayerPortraitOutput = z.infer<typeof PlayerPortraitOutputSchema>;

export async function generatePlayerPortrait(input: PlayerPortraitInput): Promise<PlayerPortraitOutput> {
  return generatePlayerPortraitFlow(input);
}

const generatePlayerPortraitFlow = ai.defineFlow(
  {
    name: 'generatePlayerPortraitFlow',
    inputSchema: PlayerPortraitInputSchema,
    outputSchema: PlayerPortraitOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a photorealistic headshot portrait of a fictional cricket player named ${input.firstName} ${input.lastName}. The background should be a simple, neutral studio setting. The player should have a determined and professional expression.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
        throw new Error('Image generation failed.');
    }

    return { imageUrl: media.url };
  }
);
