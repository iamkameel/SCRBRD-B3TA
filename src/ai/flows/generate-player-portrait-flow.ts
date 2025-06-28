'use server';
/**
 * @fileOverview An AI flow to generate a unique player portrait and store it in Firebase Storage.
 *
 * - generatePlayerPortrait - A function that generates an image for a person.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { app } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";


const PlayerPortraitInputSchema = z.object({
  firstName: z.string().describe('The first name of the person.'),
  lastName: z.string().describe('The last name of the person.'),
});
export type PlayerPortraitInput = z.infer<typeof PlayerPortraitInputSchema>;

const PlayerPortraitOutputSchema = z.object({
  imageUrl: z.string().describe("The public URL of the generated image in Firebase Storage."),
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
    // 1. Generate the image with AI
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

    // 2. Upload the image to Firebase Storage
    const storage = getStorage(app);
    // Create a unique filename
    const storageRef = ref(storage, `portraits/${input.firstName}-${input.lastName}-${Date.now()}.png`);
    
    // The media.url is a data URI like 'data:image/png;base64,...'
    // We need to extract the Base64 part.
    const base64Data = media.url.split(',')[1];
    
    await uploadString(storageRef, base64Data, 'base64', {
        contentType: 'image/png'
    });

    // 3. Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);

    return { imageUrl: downloadURL };
  }
);
