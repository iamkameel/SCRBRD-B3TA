'use server';

import { generateMatchSummary, type MatchSummaryInput } from '@/ai/flows/generate-match-summary';
import { generateMatchImage, type MatchImageInput } from '@/ai/flows/generate-match-image';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  team1Name: z.string().min(1, { message: 'Team 1 name is required.' }),
  team2Name: z.string().min(1, { message: 'Team 2 name is required.' }),
  team1Stats: z.string().min(1, { message: 'Team 1 statistics are required.' }),
  team2Stats: z.string().min(1, { message: 'Team 2 statistics are required.' }),
  keyHighlights: z.string().min(1, { message: 'Key highlights are required.' }),
});

export async function createSummaryAction(formData: FormData) {
  const rawFormData = {
    team1Name: formData.get('team1Name'),
    team2Name: formData.get('team2Name'),
    team1Stats: formData.get('team1Stats'),
    team2Stats: formData.get('team2Stats'),
    keyHighlights: formData.get('keyHighlights'),
  };

  const validatedFields = FormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors
      .map((e) => e.message)
      .join(' ');
    return redirect(`/?error=${encodeURIComponent(errorMessages)}`);
  }

  try {
    const { team1Name, team2Name } = validatedFields.data;
    
    // Run both AI calls in parallel
    const [summaryResult, imageResult] = await Promise.all([
      generateMatchSummary(validatedFields.data as MatchSummaryInput),
      generateMatchImage({ team1Name, team2Name } as MatchImageInput),
    ]);
    
    const { summary } = summaryResult;
    const { imageUrl } = imageResult;

    const params = new URLSearchParams({
      summary,
      imageUrl,
      team1Name,
      team2Name,
    });
    redirect(`/summary?${params.toString()}`);
  } catch (error) {
    console.error('Failed to generate summary or image:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return redirect(`/?error=${encodeURIComponent(`AI generation failed: ${errorMessage}`)}`);
  }
}
