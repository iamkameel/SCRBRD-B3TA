'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WeatherForecastInputSchema, WeatherDetailsSchema } from '@/ai/schemas';

/**
 * A tool to get a weather forecast for a specific location and date.
 * In a real application, this would call a real weather API.
 * For this demo, it returns a plausible, semi-randomized forecast.
 */
export const getWeatherForecast = ai.defineTool(
  {
    name: 'getWeatherForecast',
    description: 'Returns the weather forecast for a given location and date.',
    inputSchema: WeatherForecastInputSchema,
    outputSchema: WeatherDetailsSchema,
  },
  async ({ location, date }) => {
    // Simple deterministic pseudo-randomness based on location and date
    // to ensure the same forecast is returned for the same inputs.
    const seed = location.length + new Date(date).getDate();
    const tempRand = (seed * 9301 + 49297) % 233280;
    const conditionRand = (seed * 9301 + 49297) % 233281;
    const precipRand = (seed * 9301 + 49297) % 233282;
    const windRand = (seed * 9301 + 49297) % 233283;

    const temperature = 18 + (tempRand % 15); // Temp between 18 and 32
    const conditions = ["Sunny", "Cloudy", "Showers", "Rain", "Storm"];
    const condition = conditions[conditionRand % conditions.length];

    let precipitationChance = 0;
    if (condition === "Showers") precipitationChance = 20 + (precipRand % 30); // 20-50%
    if (condition === "Rain") precipitationChance = 50 + (precipRand % 40); // 50-90%
    if (condition === "Storm") precipitationChance = 70 + (precipRand % 30); // 70-100%

    const windSpeed = 5 + (windRand % 20); // Wind between 5 and 25 km/h

    return {
      temperature,
      condition,
      precipitationChance,
      windSpeed,
    };
  }
);
