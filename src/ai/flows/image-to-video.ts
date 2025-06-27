'use server';
/**
 * @fileOverview A flow for generating video from an image using Fal.ai Kling.
 *
 * - imageToVideo - A function that generates a video based on the provided image and prompt.
 * - ImageToVideoInput - The input type for the imageToVideo function.
 * - ImageToVideoOutput - The return type for the imageToVideo function.
 */
import * as fal from '@fal-ai/serverless-client';
import { z } from 'zod';

const ImageToVideoInputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the image to animate."),
  prompt: z.string().optional().describe('An optional text prompt to guide video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type ImageToVideoInput = z.infer<typeof ImageToVideoInputSchema>;

const ImageToVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type ImageToVideoOutput = z.infer<typeof ImageToVideoOutputSchema>;

// Note: this is not a Genkit flow.
export async function imageToVideo(input: ImageToVideoInput): Promise<ImageToVideoOutput> {
  try {
    const authenticatedFal = fal.withCredentials(input.apiKey);
    const result: any = await authenticatedFal.subscribe('fal-ai/kling-video/v2.1/master/image-to-video', {
        input: {
          image_url: input.imageUrl,
          prompt: input.prompt,
        },
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
    console.error('Fal.ai image-to-video generation error:', error);
    throw new Error(error.message || 'Failed to generate video from Fal.ai.');
  }
}
