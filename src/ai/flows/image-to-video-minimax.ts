'use server';
/**
 * @fileOverview A flow for generating video from an image using Fal.ai Minimax.
 *
 * - imageToVideoMinimax - A function that generates a video based on the provided image and prompt.
 * - ImageToVideoMinimaxInput - The input type for the imageToVideoMinimax function.
 * - ImageToVideoMinimaxOutput - The return type for the imageToVideoMinimax function.
 */
import { fal } from '@fal-ai/client';
import { z } from 'zod';

const ImageToVideoMinimaxInputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the image to animate."),
  prompt: z.string().optional().describe('An optional text prompt to guide video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type ImageToVideoMinimaxInput = z.infer<typeof ImageToVideoMinimaxInputSchema>;

const ImageToVideoMinimaxOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type ImageToVideoMinimaxOutput = z.infer<typeof ImageToVideoMinimaxOutputSchema>;

// Note: this is not a Genkit flow.
export async function imageToVideoMinimax(input: ImageToVideoMinimaxInput): Promise<ImageToVideoMinimaxOutput> {
  try {
    const result: any = await fal.subscribe('fal-ai/minimax-video/image-to-video', {
        input: {
          image_url: input.imageUrl,
          prompt: input.prompt,
        },
        credentials: input.apiKey,
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === 'IN_PROGRESS' && update.logs) {
            update.logs.forEach((log: { message: string }) => console.log(log.message));
          }
        },
    });

    if (!result || !result.video || !result.video.url) {
        throw new Error('Video generation result was invalid or did not contain a video URL.');
    }

    return { videoUrl: result.video.url };
  } catch (error: any) {
    console.error('Fal.ai Minimax image-to-video generation error:', error);
    throw new Error(error.message || 'Failed to generate video from Fal.ai.');
  }
}
