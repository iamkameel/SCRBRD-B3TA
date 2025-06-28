
'use server';
/**
 * @fileOverview An AI flow to generate audio commentary for a cricket match.
 *
 * - generateMatchCommentary - A function that generates audio commentary from a scorecard.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InningsSchema } from '@/ai/schemas';
import wav from 'wav';

const CommentaryInputSchema = z.object({
  innings1: InningsSchema,
  innings2: InningsSchema,
});
export type CommentaryInput = z.infer<typeof CommentaryInputSchema>;

const CommentaryOutputSchema = z.object({
  audioUrl: z.string().describe("The generated audio commentary as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type CommentaryOutput = z.infer<typeof CommentaryOutputSchema>;

const generateCommentaryScriptPrompt = ai.definePrompt({
    name: 'generateCommentaryScriptPrompt',
    input: { schema: z.object({ innings1: z.string(), innings2: z.string() }) },
    output: { format: 'text' },
    prompt: `You are a cricket commentary script writer. Based on the JSON scorecard data for two innings, write an exciting and engaging commentary script for two speakers, Speaker1 and Speaker2.

The script should cover the key moments of the match:
- The opening powerplay of both innings.
- Key partnerships and quick fall of wickets.
- Highlight performances (e.g., a player scoring a 50, a bowler taking multiple wickets).
- The turning point of the match.
- The final, tense moments of the run chase.

The script should be formatted with "Speaker1:" and "Speaker2:" prefixes for a multi-speaker text-to-speech engine. The total script should be for about 2-3 minutes of commentary.

Innings 1 Data:
{{{innings1}}}

Innings 2 Data:
{{{innings2}}}

Generate only the commentary script.`,
});


async function toWav( pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2 ): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateMatchCommentaryFlow = ai.defineFlow(
  {
    name: 'generateMatchCommentaryFlow',
    inputSchema: CommentaryInputSchema,
    outputSchema: CommentaryOutputSchema,
  },
  async (input) => {
    // 1. Generate the script
    const { output: script } = await generateCommentaryScriptPrompt({
        innings1: JSON.stringify(input.innings1, null, 2),
        innings2: JSON.stringify(input.innings2, null, 2),
    });
    
    if (!script) {
        throw new Error('Failed to generate commentary script.');
    }
    
    // 2. Generate the audio from the script
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } },
              },
            ],
          },
        },
      },
      prompt: script,
    });

    if (!media?.url) {
      throw new Error('Failed to generate audio commentary.');
    }
    
    // 3. Convert PCM to WAV
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return { audioUrl: 'data:audio/wav;base64,' + wavBase64 };
  }
);


export async function generateMatchCommentary(input: CommentaryInput): Promise<CommentaryOutput> {
    return generateMatchCommentaryFlow(input);
}
