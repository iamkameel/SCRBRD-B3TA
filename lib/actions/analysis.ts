
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import { runUmpireReview } from '@/ai/flows/umpire-review-flow';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';
import { generatePlayerOfTheMatch } from '@/ai/flows/generate-player-of-the-match-flow';
import { generateMatchReport } from '@/ai/flows/generate-match-summary-flow';
import { generateMatchPreview } from '@/ai/flows/generate-match-preview-flow';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import { generateMatchCommentary } from '@/ai/flows/generate-match-commentary-flow';
import { selectLineup } from '@/ai/flows/select-lineup-flow';
import { generateOppositionAnalysis } from '@/ai/flows/generate-opposition-analysis-flow';
import { generateLiveMatchUpdate } from '@/ai/flows/generate-live-match-update-flow';


import type { UmpireDecisionOutput, GenerateMatchReportInput, GenerateScorecardOutput, PlayerOfTheMatchOutput, LiveMatchUpdateOutput } from '@/ai/schemas';
import type { MatchForecast } from '@/lib/data';
import { getMatch, getMatchLineup, saveScorecard, getScorecard } from './matches';
import { getPerson } from './players';

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

export async function generateAndSaveScorecardAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const [teamALineup, teamBLineup] = await Promise.all([
        getMatchLineup(matchId, match.teamAId),
        getMatchLineup(matchId, match.teamBId),
    ]);

    if (teamALineup.length !== 11 || teamBLineup.length !== 11) {
        throw new Error("Both teams must have exactly 11 players selected in their lineup to generate a scorecard.");
    }
    
    const getPlayerNames = async (playerIds: string[]): Promise<string[]> => {
        const personPromises = playerIds.map(id => getPerson(id));
        const people = await Promise.all(personPromises);
        return people.map(p => {
            if (!p) throw new Error("A player in the lineup could not be found.");
            return `${p.firstName} ${p.lastName}`;
        });
    };

    const [teamAPlayerNames, teamBPlayerNames] = await Promise.all([
        getPlayerNames(teamALineup),
        getPlayerNames(teamBLineup),
    ]);
    
    const scorecardData = await generateScorecard({
        teamAName: match.teamAName,
        teamAPlayers: teamAPlayerNames,
        teamBName: match.teamBName,
        teamBPlayers: teamBPlayerNames,
    });
    
    if (!scorecardData) {
        throw new Error("AI failed to generate scorecard data.");
    }
    
    const potmData = await generatePlayerOfTheMatch(scorecardData);

    if (!potmData) {
        throw new Error("AI failed to generate Player of the Match data.");
    }
    
    await saveScorecard(matchId, scorecardData, potmData);

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Scorecard generated successfully!" };
}

export async function generateMatchReportAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const scorecard = await getScorecard(matchId);
    if (!scorecard) throw new Error("A complete scorecard is required to generate a report.");

    const reportInput: GenerateMatchReportInput = {
        teamAName: match.teamAName,
        teamBName: match.teamBName,
        innings1: scorecard.innings1,
        innings2: scorecard.innings2,
    };

    const reportText = await generateMatchReport(reportInput);

    if (!reportText) {
        throw new Error("AI failed to generate a match report.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { report: reportText });
    } catch (error) {
        console.error(`Error saving report for match ${matchId}:`, error);
        throw new Error("Could not save match report.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match report generated successfully!" };
}

export async function getMatchForecastAction(matchId: string): Promise<MatchForecast | { error: string }> {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) {
        return { error: "Match not found or permission denied." };
    }

    try {
        const forecast = await getMatchForecast(matchId);
        return forecast;
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        console.error(`Error getting forecast for match ${matchId}:`, error);
        return { error: message };
    }
}

export async function generateMatchPreviewAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match || !match.teamBId) throw new Error("Match not found or opponent is not set.");

    const previewText = await generateMatchPreview(matchId);

    if (!previewText) {
        throw new Error("AI failed to generate a match preview.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { preview: previewText });
    } catch (error) {
        console.error(`Error saving preview for match ${matchId}:`, error);
        throw new Error("Could not save match preview.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match preview generated successfully!" };
}

export async function generateMatchCommentaryAction(matchId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const scorecard = await getScorecard(matchId);
    if (!scorecard) throw new Error("A complete scorecard is required to generate commentary.");
    
    try {
        const { audioUrl } = await generateMatchCommentary({
            innings1: scorecard.innings1,
            innings2: scorecard.innings2,
        });

        if (!audioUrl) {
            throw new Error("AI failed to generate audio commentary.");
        }

        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { audioCommentaryUrl: audioUrl });

        revalidatePath(`/matches/${matchId}`);
        return { success: true, message: "Audio commentary generated successfully!" };

    } catch (error) {
        console.error(`Error generating commentary for match ${matchId}:`, error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate audio commentary.");
    }
}

export async function autoSelectLineupAction(matchId: string, teamId: string): Promise<{ playerIds: string[], justification: string }> {
    if (!userId) throw new Error("User not authenticated");
    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    try {
        const { playerIds, justification } = await selectLineup({ matchId, teamId });
        return { playerIds, justification };
    } catch (error) {
        console.error("Error auto-selecting lineup:", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not auto-select lineup.");
    }
}

export async function generateOppositionAnalysisAction(matchId: string, opponentTeamId: string) {
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    if (match.status !== 'scheduled') {
        throw new Error("Opposition analysis can only be generated for scheduled matches.");
    }
    
    const opponentTeamName = opponentTeamId === match.teamAId ? match.teamAName : match.teamBName;

    const analysisText = await generateOppositionAnalysis({ opponentTeamId, opponentTeamName });

    if (!analysisText) {
        throw new Error("AI failed to generate an opposition analysis.");
    }

    try {
        const matchRef = doc(db, 'matches', matchId);
        const updateKey = `analysisReports.${opponentTeamId}`;
        await updateDoc(matchRef, { [updateKey]: analysisText });
    } catch (error) {
        console.error(`Error saving opposition analysis for match ${matchId}:`, error);
        throw new Error("Could not save opposition analysis.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Opposition analysis generated successfully!" };
}

export async function generateLiveMatchUpdateAction(matchId: string): Promise<LiveMatchUpdateOutput> {
    if (!userId) throw new Error("User not authenticated.");
    const match = await getMatch(matchId);
    if (!match || !match.liveScore) throw new Error("Match not found or no live score data available.");

    const isFirstInnings = match.liveScore.liveInnings === 1;
    const battingTeamName = isFirstInnings ? match.teamAName : match.teamBName;
    const bowlingTeamName = isFirstInnings ? match.teamBName : match.teamAName;
    const targetScore = isFirstInnings ? undefined : match.firstInningsTotal ? match.firstInningsTotal + 1 : undefined;

    try {
        const result = await generateLiveMatchUpdate({
            battingTeamName: battingTeamName,
            bowlingTeamName: bowlingTeamName,
            currentScore: match.liveScore.runs,
            wickets: match.liveScore.wickets,
            overs: parseFloat(`${match.liveScore.overs}.${match.liveScore.balls}`),
            targetScore: targetScore,
        });
        return result;
    } catch (error) {
        console.error("Error generating live match update:", error);
        if (error instanceof Error) throw error;
        throw new Error("The AI failed to generate a live match update.");
    }
}
