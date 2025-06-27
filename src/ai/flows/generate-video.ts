'use server';
/**
 * @fileOverview A flow for generating video from a text prompt using Fal.ai Veo3.
 *
 * - generateVideo - A function that generates a video based on the provided prompt.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */
// Use require for robust module loading in Next.js server environment
const fal = require('@fal-ai/serverless-client');
import { z } from 'zod';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to use for video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

// Note: this is not a Genkit flow.
export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  try {
    // Correctly call withCredentials as a method of the imported module
    const result: any = await fal.withCredentials(input.apiKey)
      .subscribe('fal-ai/veo3', {
        input: {
          prompt: input.prompt,
        },
      });

    if (!result || !result.video || !result.video.url) {
        throw new Error('Video generation result was invalid.');
    }

    return { videoUrl: result.video.url };
  } catch (error: any) {
    console.error('Fal.ai video generation error:', error);
    throw new Error(error.message || 'Failed to generate video from Fal.ai.');
  }
}
