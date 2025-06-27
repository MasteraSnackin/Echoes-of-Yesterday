'use server';
/**
 * @fileOverview A flow for animating an avatar image using Fal.ai's Stable Video Diffusion.
 *
 * - avatarToVideo - Generates a short video from an avatar image.
 * - AvatarToVideoInput - The input type for the avatarToVideo function.
 * - AvatarToVideoOutput - The return type for the avatarToVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import * as fal from '@fal-ai/serverless-client';

const AvatarToVideoInputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "The avatar image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type AvatarToVideoInput = z.infer<typeof AvatarToVideoInputSchema>;

const AvatarToVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type AvatarToVideoOutput = z.infer<typeof AvatarToVideoOutputSchema>;

export async function avatarToVideo(input: AvatarToVideoInput): Promise<AvatarToVideoOutput> {
  return avatarToVideoFlow(input);
}

const avatarToVideoFlow = ai.defineFlow(
  {
    name: 'avatarToVideoFlow',
    inputSchema: AvatarToVideoInputSchema,
    outputSchema: AvatarToVideoOutputSchema,
  },
  async (input) => {
    const { avatarDataUri, apiKey } = input;

    fal.config({
        credentials: `${apiKey}`,
    });

    try {
      // The model expects a URL, so we pass the data URI directly.
      const result: { video: { url: string } } = await fal.run('fal-ai/stable-video-diffusion', {
        input: {
          image_url: avatarDataUri,
          motion_bucket_id: 127, // Controls the amount of motion
          cond_aug: 0.02, // Controls the noise level
        },
      });

      if (!result?.video?.url) {
        throw new Error('Video URL not found in Fal.ai response.');
      }

      return { videoUrl: result.video.url };

    } catch (error: any) {
        console.error('Fal.ai SVD API error:', error);
        throw new Error(`Failed to generate video from Fal.ai: ${error.message}`);
    }
  }
);
