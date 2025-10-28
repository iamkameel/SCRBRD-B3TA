
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import { runUmpireReview } from '@/ai/flows/umpire-review-flow';
import { generateScorecard } from '@/ai/flows/generate-scorecard-flow';
import { getTopPerformers } from '@/ai/flows/generate-player-of-the-match-flow';
import { generateMatchReport } from '@/ai/flows/generate-match-summary-flow';
import { generateMatchPreview } from '@/ai/flows/generate-match-preview-flow';
import { getMatchForecast } from '@/ai/flows/get-match-forecast-flow';
import { generateMatchCommentary } from '@/ai/flows/generate-match-commentary-flow';
import { selectLineup } from '@/ai/flows/select-lineup-flow';
import { generateOppositionAnalysis } from '@/ai/flows/generate-opposition-analysis-flow';
import { generateLiveMatchUpdate } from '@/ai/flows/generate-live-match-update-flow';
import { queryStats } from '@/ai/flows/stats-query-flow';
import { generatePlayerPerformanceForecast } from '@/ai/flows/generate-player-performance-forecast-flow';
import { scoutPlayer } from '@/ai/flows/scout-player-flow';
import { generateHighlightReel } from '@/ai/flows/generate-highlight-reel-flow';


import type { UmpireDecisionOutput, GenerateMatchReportInput, PlayerOfTheMatch, LiveMatchUpdateOutput, PlayerPerformanceForecastInput, PlayerPerformanceForecastOutput, ScoutingReportInput, ScoutingReportOutput, HighlightReelOutput, UmpireReviewInput } from '@/ai/schemas';
import type { MatchForecast, Person } from '@/lib/data';
import { getMatch, getMatchLineup, saveScorecard, getScorecard } from './matches';
import { getPerson } from './players';
import { getTeam } from './teams';
import { getUserId } from '@/lib/firebase-admin';


export async function runScoutingReportAction(input: ScoutingReportInput): Promise<ScoutingReportOutput> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated.");
  }
  
  if (!input.photoDataUri) {
    throw new Error("An image is required for the scouting report.");
  }

  try {
    const result = await scoutPlayer(input);
    return result;
  } catch (error) {
    console.error("Error running scouting report:", error);
    if (error instanceof Error) throw error;
    throw new Error("The AI scouting report failed to complete.");
  }
}

export async function generateAndSaveScorecardAction(matchId: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const [teamALineup, teamBLineup] = await Promise.all([
        getMatchLineup(matchId, match.teamAId),
        getMatchLineup(matchId, match.teamBId),
    ]);

    if (teamALineup.playingXI.length !== 11 || teamBLineup.playingXI.length !== 11) {
        throw new Error("Both teams must have exactly 11 players selected in their lineup to generate a scorecard.");
    }
    
    const getPlayerNames = async (playerIds: string[]): Promise<string[]> => {
        const personPromises = playerIds.map(id => getPerson(id));
        const people = (await Promise.all(personPromises)).filter((p): p is Person => p !== null);

        if (people.length !== playerIds.length) {
            throw new Error("One or more players in the lineup could not be found.");
        }

        const lastNameCounts = people.reduce((acc, p) => {
            acc[p.lastName] = (acc[p.lastName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return people.map(p => {
            if (lastNameCounts[p.lastName] > 1) {
                return `${p.firstName.charAt(0)}. ${p.lastName}`;
            }
            return `${p.firstName} ${p.lastName}`;
        });
    };


    const [teamAPlayerNames, teamBPlayerNames] = await Promise.all([
        getPlayerNames(teamALineup.playingXI),
        getPlayerNames(teamBLineup.playingXI),
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
    
    const { performers } = await getTopPerformers(scorecardData);

    if (!performers || performers.length === 0) {
        throw new Error("AI failed to generate Player of the Match data.");
    }
    
    await saveScorecard(matchId, scorecardData, performers[0]);

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Scorecard generated successfully!" };
}

export async function generateMatchReportAction(matchId: string) {
    const userId = await getUserId();
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
        console.error("Error saving report for match " + matchId + ":", error);
        throw new Error("Could not save match report.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match report generated successfully!" };
}

export async function getMatchForecastAction(matchId: string): Promise<MatchForecast | { error: string }> {
    const userId = await getUserId();
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
        console.error("Error getting forecast for match " + matchId + ":", error);
        return { error: message };
    }
}

export async function generateMatchPreviewAction(matchId: string) {
    const userId = await getUserId();
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
        console.error("Error saving preview for match " + matchId + ":", error);
        throw new Error("Could not save match preview.");
    }

    revalidatePath(`/matches/${matchId}`);
    return { success: true, message: "Match preview generated successfully!" };
}

export async function generateMatchCommentaryAction(matchId: string) {
    const userId = await getUserId();
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
        console.error("Error generating commentary for match " + matchId + ":", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate audio commentary.");
    }
}

export async function autoSelectLineupAction(matchId: string, teamId: string): Promise<{ playerIds: string[], justification: string }> {
    const userId = await getUserId();
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

export async function generateOppositionAnalysisAction(teamId: string): Promise<string> {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const team = await getTeam(teamId);
    if (!team) throw new Error("Team not found or permission denied.");
    
    try {
        const analysisText = await generateOppositionAnalysis({ opponentTeamId: teamId });
        
        if (!analysisText) {
            throw new Error("AI failed to generate an opposition analysis.");
        }
        
        // Save the analysis report to the team's document
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, { analysisReport: analysisText });
        revalidatePath(`/teams/${teamId}`);
        
        return analysisText;

    } catch (error) {
        console.error("Error generating opposition analysis for team " + teamId + ":", error);
        if (error instanceof Error) throw error;
        throw new Error("Could not generate opposition analysis.");
    }
}

export async function generateLiveMatchUpdateAction(matchId: string): Promise<LiveMatchUpdateOutput> {
    const userId = await getUserId();
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
            overs: match.liveScore.overs,
            balls: match.liveScore.balls || 0,
            targetScore: targetScore,
        });
        return result;
    } catch (error) {
        console.error("Error generating live match update:", error);
        if (error instanceof Error) throw error;
        throw new Error("The AI failed to generate a live match update.");
    }
}


export async function queryStatsAction(question: string): Promise<string> {
    const userId = await getUserId();
    if (!userId) {
        throw new Error("User not authenticated.");
    }
    if (!question) {
        throw new Error("A question is required.");
    }

    try {
        const answer = await queryStats(question);
        return answer;
    } catch (error) {
        console.error("Error querying stats:", error);
        if (error instanceof Error) throw error;
        throw new Error("The AI failed to answer your question.");
    }
}

export async function generatePlayerPerformanceForecastAction(input: PlayerPerformanceForecastInput): Promise<PlayerPerformanceForecastOutput> {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    try {
        const result = await generatePlayerPerformanceForecast(input);
        return result;
    } catch (error) {
        console.error("Error generating player performance forecast:", error);
        if (error instanceof Error) throw error;
        throw new Error("The AI failed to generate a performance forecast.");
    }
}

export async function runUmpireReviewAction(input: UmpireReviewInput): Promise<UmpireDecisionOutput> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated.");
  }
  
  if (!input.mediaDataUri) {
    throw new Error("An image or video is required for the review.");
  }

  try {
    const result = await runUmpireReview(input);
    return result;
  } catch (error) {
    console.error("Error running umpire review:", error);
    if (error instanceof Error) throw error;
    throw new Error("The AI umpire review failed to complete.");
  }
}

export async function generateHighlightReelAction(matchId: string): Promise<HighlightReelOutput> {
    const userId = await getUserId();
    if (!userId) throw new Error("User not authenticated.");

    const match = await getMatch(matchId);
    if (!match) throw new Error("Match not found or permission denied.");

    const scorecard = await getScorecard(matchId);
    if (!scorecard) {
        throw new Error("A complete scorecard is required to generate highlights.");
    }

    try {
        // The flow now needs the matchId to create unique storage paths
        const result = await generateHighlightReel(matchId, {
            teamAName: match.teamAName,
            teamBName: match.teamBName,
            innings1: scorecard.innings1,
            innings2: scorecard.innings2,
        });
        return result;
    } catch (error) {
        console.error("Error generating highlight reel:", error);
        if (error instanceof Error) throw error;
        throw new Error("The AI failed to generate highlights.");
    }
}
