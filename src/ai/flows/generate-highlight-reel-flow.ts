'use server';
/**
 * @fileOverview An AI flow to generate a highlight reel from a match scorecard.
 *
 * - generateHighlightReel - A function that analyzes a scorecard to identify key moments and generate images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { app } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { GenerateMatchReportInputSchema, HighlightReelSchema, type HighlightReelOutput, type GenerateMatchReportInput, HighlightEventSchema } from '@/ai/schemas';


const HighlightReelTextOnlySchema = z.object({
  highlights: z.array(z.object({
    over: z.string().describe("The over in which the event occurred, e.g., '19.2'."),
    description: z.string().describe("A short, exciting, one-sentence description of the key moment."),
  })).min(5).max(8).describe("A list of 5 to 8 key moments from the match, ordered chronologically."),
});

const prompt = ai.definePrompt({
    name: 'generateHighlightReelPrompt',
    input: { schema: GenerateMatchReportInputSchema },
    output: { schema: HighlightReelTextOnlySchema },
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

const generateHighlightImage = async (description: string, matchId: string, index: number): Promise<string> => {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a dynamic, cinematic, photorealistic image of a cricket match moment described as: "${description}". The image should look like a professional sports photograph.`,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media?.url) {
        throw new Error('Image generation failed for a highlight.');
    }

    const storage = getStorage(app);
    const storageRef = ref(storage, `highlights/${matchId}/highlight-${index}-${Date.now()}.png`);
    
    const base64Data = media.url.split(',')[1];
    
    await uploadString(storageRef, base64Data, 'base64', {
        contentType: 'image/png'
    });

    return getDownloadURL(storageRef);
};


const generateHighlightReelFlow = ai.defineFlow(
  {
    name: 'generateHighlightReelFlow',
    inputSchema: z.object({ matchId: z.string(), reportInput: GenerateMatchReportInputSchema }),
    outputSchema: HighlightReelSchema,
  },
  async ({ matchId, reportInput }) => {
    // 1. Get text-based highlights from the LLM.
    const { output: textHighlights } = await prompt(reportInput);
    if (!textHighlights?.highlights || textHighlights.highlights.length === 0) {
        throw new Error('AI failed to generate highlight descriptions.');
    }

    // 2. Generate an image for each highlight in parallel.
    const imagePromises = textHighlights.highlights.map((highlight, index) => 
        generateHighlightImage(highlight.description, matchId, index)
    );

    const imageUrls = await Promise.all(imagePromises);

    // 3. Combine text descriptions with their generated image URLs.
    const finalHighlights: z.infer<typeof HighlightEventSchema>[] = textHighlights.highlights.map((highlight, index) => ({
        ...highlight,
        imageUrl: imageUrls[index],
    }));

    return { highlights: finalHighlights };
  }
);

// We need to update the exported function to match the new flow input schema.
export async function generateHighlightReel(matchId: string, input: GenerateMatchReportInput): Promise<HighlightReelOutput> {
    return generateHighlightReelFlow({ matchId, reportInput: input });
}
