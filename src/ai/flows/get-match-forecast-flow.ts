'use server';
/**
 * @fileOverview An AI flow to generate a weather forecast for a cricket match.
 *
 * - getMatchForecast - A function that returns a weather summary and details for a given match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getMatch } from '@/lib/actions/matches';
import { getWeatherForecast } from '@/ai/tools/weather-tool';
import { GetMatchForecastOutputSchema, type GetMatchForecastOutput } from '@/ai/schemas';
import { format } from 'date-fns';

const getMatchForecastPrompt = ai.definePrompt({
    name: 'matchForecastPrompt',
    system: `You are a helpful cricket match assistant. 
Your goal is to provide a weather forecast for the user's match.
Use the provided getWeatherForecast tool to get the weather data for the specified location and date.
Based on the data you receive from the tool, provide a concise, one-sentence summary of the forecast.
Also return the detailed weather data you received.`,
    tools: [getWeatherForecast],
    output: { schema: GetMatchForecastOutputSchema },
});


const getMatchForecastFlow = ai.defineFlow(
  {
    name: 'getMatchForecastFlow',
    inputSchema: z.string(), // matchId
    outputSchema: GetMatchForecastOutputSchema,
  },
  async (matchId) => {
    const match = await getMatch(matchId);
    if (!match) {
        throw new Error('Match not found.');
    }
    
    const { output } = await getMatchForecastPrompt(
        `Please get the weather forecast for a match at ${match.fieldName} on ${format(match.dateTime, 'yyyy-MM-dd')}.`
    );

    return output!;
  }
);

export async function getMatchForecast(matchId: string): Promise<GetMatchForecastOutput> {
    return getMatchForecastFlow(matchId);
}
