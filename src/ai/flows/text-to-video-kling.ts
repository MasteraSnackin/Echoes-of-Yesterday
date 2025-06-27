'use server';
/**
 * @fileOverview A flow for generating a short video from a text prompt using the Fal.ai Kling API.
 *
 * - textToVideoKling - Generates a video from a text prompt.
 * - TextToVideoKlingInput - The input type for the textToVideoKling function.
 * - TextToVideoKlingOutput - The return type for the textToVideoKling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fal from '@fal-ai/serverless-client';

const TextToVideoKlingInputSchema = z.object({
  prompt: z.string().describe('The text prompt for video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type TextToVideoKlingInput = z.infer<typeof TextToVideoKlingInputSchema>;

const TextToVideoKlingOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type TextToVideoKlingOutput = z.infer<typeof TextToVideoKlingOutputSchema>;

export async function textToVideoKling(input: TextToVideoKlingInput): Promise<TextToVideoKlingOutput> {
  return textToVideoKlingFlow(input);
}

const textToVideoKlingFlow = ai.defineFlow(
  {
    name: 'textToVideoKlingFlow',
    inputSchema: TextToVideoKlingInputSchema,
    outputSchema: TextToVideoKlingOutputSchema,
  },
  async (input) => {
    const { prompt, apiKey } = input;

    // Configure fal.ai client with the provided API key
    fal.config({
        credentials: `${apiKey}`,
    });

    try {
      const result: { video: { url: string } } = await fal.run('fal-ai/kling', {
        input: {
          prompt: prompt,
        },
      });

      if (!result?.video?.url) {
        throw new Error('Video URL not found in Fal.ai response.');
      }

      return { videoUrl: result.video.url };

    } catch (error: any) {
        console.error('Fal.ai Kling API error:', error);
        throw new Error(`Failed to generate video from Fal.ai: ${error.message}`);
    }
  }
);
