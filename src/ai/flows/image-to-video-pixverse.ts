'use server';
/**
 * @fileOverview A flow for generating video from an image using Fal.ai Pixverse.
 *
 * - imageToVideoPixverse - A function that generates a video based on the provided image and prompt.
 * - ImageToVideoPixverseInput - The input type for the imageToVideoPixverse function.
 * - ImageToVideoPixverseOutput - The return type for the imageToVideoPixverse function.
 */
// Use require for robust module loading in Next.js server environment
const { withCredentials } = require('@fal-ai/serverless-client');
import { z } from 'zod';

const ImageToVideoPixverseInputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the image to animate."),
  prompt: z.string().optional().describe('An optional text prompt to guide video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type ImageToVideoPixverseInput = z.infer<typeof ImageToVideoPixverseInputSchema>;

const ImageToVideoPixverseOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type ImageToVideoPixverseOutput = z.infer<typeof ImageToVideoPixverseOutputSchema>;

// Note: this is not a Genkit flow.
export async function imageToVideoPixverse(input: ImageToVideoPixverseInput): Promise<ImageToVideoPixverseOutput> {
  try {
    const fal = withCredentials(input.apiKey);
    const result: any = await fal.subscribe('fal-ai/pixverse/v4.5/image-to-video', {
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
    console.error('Fal.ai Pixverse image-to-video generation error:', error);
    throw new Error(error.message || 'Failed to generate video from Fal.ai.');
  }
}
