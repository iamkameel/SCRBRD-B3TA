
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
import { GetMatchForecastOutputSchema, WeatherDetailsSchema, type GetMatchForecastOutput } from '@/ai/schemas';
import { format } from 'date-fns';

const summarizeWeatherPrompt = ai.definePrompt({
    name: 'summarizeWeatherPrompt',
    prompt: `You are a helpful cricket match assistant. 
    Based on the provided JSON weather data, provide a concise, one-sentence summary of the forecast.
    Also return the detailed weather data you received, unchanged.
    
    Weather Data:
    {{{json details}}}`,
    input: { schema: z.object({ details: WeatherDetailsSchema }) },
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
    
    // 1. Call the "tool" function directly to get weather data
    const weatherDetails = await getWeatherForecast({
        location: match.fieldName,
        date: format(match.dateTime, 'yyyy-MM-dd'),
    });

    // 2. Call the summarization prompt
    const { output } = await summarizeWeatherPrompt({ details: weatherDetails });

    return output!;
  }
);

export async function getMatchForecast(matchId: string): Promise<GetMatchForecastOutput> {
    return getMatchForecastFlow(matchId);
}

