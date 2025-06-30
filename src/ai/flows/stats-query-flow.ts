
'use server';
/**
 * @fileOverview An AI flow to answer natural language questions about cricket stats.
 *
 * - queryStats - A function that takes a natural language question and returns an answer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCricketStats } from '@/ai/tools/stats-query-tool';

const queryStatsPrompt = ai.definePrompt({
    name: 'queryStatsPrompt',
    input: { schema: z.string() },
    output: { format: 'text' },
    tools: [getCricketStats],
    prompt: `You are a helpful cricket statistics assistant. Answer the user's question based on the data provided by the available tools. Be concise and friendly.
    
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
