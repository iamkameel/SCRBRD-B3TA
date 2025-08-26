
'use server';
/**
 * @fileOverview An AI flow to answer natural language questions about cricket stats.
 *
 * - queryStats - A function that takes a natural language question and returns an answer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCricketStats, getMatchStats } from '@/ai/tools/stats-query-tool';

const queryStatsPrompt = ai.definePrompt({
    name: 'queryStatsPrompt',
    input: { schema: z.string() },
    output: { format: 'text' },
    tools: [getCricketStats, getMatchStats],
    prompt: `You are a helpful cricket statistics assistant. Answer the user's question based on the data provided by the available tools. 
    
    If the user asks about league-wide stats (e.g., "who has the most runs?", "show me team standings"), use the 'getCricketStats' tool.
    
    If the user asks about a specific match between two teams (e.g., "who won the MHS vs HC game?"), use the 'getMatchStats' tool to get the detailed scorecard before answering.
    
    Be concise and friendly in your answer.

    Question: {{{input}}}
    `,
});

const queryStatsFlow = ai.defineFlow(
    {
        name: 'queryStatsFlow',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (question) => {
        const { output } = await queryStatsPrompt(question);
        return output || "I couldn't find an answer to that question.";
    }
);

export async function queryStats(question: string): Promise<string> {
    return queryStatsFlow(question);
}
