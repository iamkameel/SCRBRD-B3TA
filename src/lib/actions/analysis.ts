'use server';

import { runUmpireReview } from '@/ai/flows/umpire-review-flow';
import type { UmpireDecisionOutput } from '@/ai/schemas';

const userId = "nOhC8mQcxDYP7acGpky6dPJVLYG2";

export async function runUmpireReviewAction(photoDataUri: string): Promise<UmpireDecisionOutput> {
  if (!userId) {
    throw new Error("User not authenticated.");
  }
  
  if (!photoDataUri) {
    throw new Error("An image is required for the review.");
  }

  try {
    const result = await runUmpireReview({ photoDataUri });
    return result;
  } catch (error) {
    console.error("Error running umpire review:", error);
    if (error instanceof Error) throw error;
    throw new Error("The AI umpire review failed to complete.");
  }
}
