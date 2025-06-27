'use server';
/**
 * @fileOverview A flow for generating a multi-person AI avatar video using Fal.ai.
 * - generateAiAvatarVideo - Generates a video from an image, two audio files, and a prompt.
 * - GenerateAiAvatarVideoInput - Input schema for the flow.
 * - GenerateAiAvatarVideoOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Helper function to upload files to Fal.ai storage
async function uploadFileToFal(dataUri: string, apiKey: string): Promise<string> {
    const fetchResponse = await fetch(dataUri);
    const blob = await fetchResponse.blob();

    const uploadResponse = await fetch('https://fal.ai/api/storage/upload/file', {
        method: 'POST',
        headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': blob.type,
        },
        body: blob,
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file to Fal.ai storage: ${errorText}`);
    }

    const { url } = await uploadResponse.json();
    return url;
}


const GenerateAiAvatarVideoInputSchema = z.object({
  apiKey: z.string().describe('The Fal.ai API key.'),
  prompt: z.string().describe('The text prompt to guide video generation.'),
  imageDataUri: z.string().describe("A photo of the subjects as a data URI."),
  firstAudioDataUri: z.string().describe("The audio for the first person as a data URI."),
  secondAudioDataUri: z.string().optional().describe("The audio for the second person as a data URI."),
  numFrames: z.number().optional().default(181),
  seed: z.number().optional().default(81),
  turbo: z.boolean().optional().default(true),
});
export type GenerateAiAvatarVideoInput = z.infer<typeof GenerateAiAvatarVideoInputSchema>;

const GenerateAiAvatarVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type GenerateAiAvatarVideoOutput = z.infer<typeof GenerateAiAvatarVideoOutputSchema>;

export async function generateAiAvatarVideo(input: GenerateAiAvatarVideoInput): Promise<GenerateAiAvatarVideoOutput> {
  return generateAiAvatarVideoFlow(input);
}


const generateAiAvatarVideoFlow = ai.defineFlow(
  {
    name: 'generateAiAvatarVideoFlow',
    inputSchema: GenerateAiAvatarVideoInputSchema,
    outputSchema: GenerateAiAvatarVideoOutputSchema,
  },
  async (input) => {
    const { apiKey, prompt, imageDataUri, firstAudioDataUri, secondAudioDataUri, numFrames, seed, turbo } = input;

    // 1. Upload files to Fal.ai storage
    const imageUrl = await uploadFileToFal(imageDataUri, apiKey);
    const firstAudioUrl = await uploadFileToFal(firstAudioDataUri, apiKey);
    let secondAudioUrl: string | undefined = undefined;
    if (secondAudioDataUri) {
        secondAudioUrl = await uploadFileToFal(secondAudioDataUri, apiKey);
    }
    
    // 2. Submit the request to the queue
    const submitUrl = 'https://queue.fal.run/fal-ai/ai-avatar/multi';
    const payload: any = {
      prompt,
      image_url: imageUrl,
      first_audio_url: firstAudioUrl,
      num_frames: numFrames,
      seed,
      turbo
    };

    if (secondAudioUrl) {
        payload.second_audio_url = secondAudioUrl;
    }

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Failed to submit job to Fal.ai queue: ${errorText}`);
    }

    const { request_id } = await submitResponse.json();
    const statusUrl = `https://queue.fal.run/fal-ai/ai-avatar/multi/requests/${request_id}/status`;
    const resultUrl = `https://queue.fal.run/fal-ai/ai-avatar/multi/requests/${request_id}`;

    // 3. Poll for the result
    let statusData;
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes timeout

    do {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
      const statusResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });
      attempts++;

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Failed to get job status from Fal.ai: ${errorText}`);
      }
      statusData = await statusResponse.json();
      
      if (statusData.status === 'COMPLETED' || statusData.status === 'SUCCEEDED') {
        break;
      }
      if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
          throw new Error(`Video generation failed with status: ${statusData.status}. Logs: ${JSON.stringify(statusData.logs)}`);
      }
      if(attempts > maxAttempts) {
        throw new Error("Video generation timed out after 5 minutes.");
      }

    } while (true);

    // 4. Fetch the final result
    const resultResponse = await fetch(resultUrl, {
      headers: { 'Authorization': `Key ${apiKey}` },
    });
    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      throw new Error(`Failed to get job result from Fal.ai: ${errorText}`);
    }

    const resultData = await resultResponse.json();
    if (!resultData.video || !resultData.video.url) {
        throw new Error(`Unexpected result format from Fal.ai: ${JSON.stringify(resultData)}`);
    }

    return { videoUrl: resultData.video.url };
  }
);
