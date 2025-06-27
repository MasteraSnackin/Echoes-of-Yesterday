'use server';
/**
 * @fileOverview A flow for generating video from an image using Fal.ai's Minimax model.
 * - imageToVideoMinimax - Generates a video from an image and an optional prompt.
 * - ImageToVideoMinimaxInput - Input schema for the flow.
 * - ImageToVideoMinimaxOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageToVideoMinimaxInputSchema = z.object({
  apiKey: z.string().describe('The Fal.ai API key.'),
  imageUrl: z.string().describe("A photo to animate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  prompt: z.string().optional().describe('The text prompt to guide video generation.'),
});
export type ImageToVideoMinimaxInput = z.infer<typeof ImageToVideoMinimaxInputSchema>;

const ImageToVideoMinimaxOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type ImageToVideoMinimaxOutput = z.infer<typeof ImageToVideoMinimaxOutputSchema>;

export async function imageToVideoMinimax(input: ImageToVideoMinimaxInput): Promise<ImageToVideoMinimaxOutput> {
  return imageToVideoMinimaxFlow(input);
}

const imageToVideoMinimaxFlow = ai.defineFlow(
  {
    name: 'imageToVideoMinimaxFlow',
    inputSchema: ImageToVideoMinimaxInputSchema,
    outputSchema: ImageToVideoMinimaxOutputSchema,
  },
  async (input) => {
    const { apiKey, imageUrl, prompt } = input;

    // 1. Submit the request to the queue
    const submitUrl = 'https://queue.fal.run/fal-ai/minimax/hailuo-02/standard/image-to-video';
    const payload = {
      image_url: imageUrl,
      prompt: prompt,
    };

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (submitResponse.status === 401) {
        throw new Error('Fal.ai API key is invalid or missing.');
    }

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Failed to submit job to Fal.ai queue: ${errorText}`);
    }

    const { request_id } = await submitResponse.json();
    if (!request_id) {
        throw new Error('Fal.ai did not return a request_id.');
    }

    const statusUrl = `https://queue.fal.run/fal-ai/minimax/requests/${request_id}/status`;
    const resultUrl = `https://queue.fal.run/fal-ai/minimax/requests/${request_id}`;
    
    // 2. Poll for the result
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
         if (statusResponse.status === 404 && attempts < 10) {
            console.warn(`Polling status returned 404 for request ${request_id}, attempt ${attempts}. Retrying...`);
            continue;
        }
        throw new Error(`Failed to get job status from Fal.ai: ${errorText} (Status: ${statusResponse.status})`);
      }

      statusData = await statusResponse.json();
      
      if (statusData.status === 'COMPLETED' || statusData.status === 'SUCCEEDED') {
        break;
      }
      if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
          const logs = statusData.logs ? JSON.stringify(statusData.logs) : 'No logs available.';
          throw new Error(`Video generation failed with status: ${statusData.status}. Logs: ${logs}`);
      }
      if(attempts > maxAttempts) {
        throw new Error("Video generation timed out after 5 minutes.");
      }

    } while (true);

    // 3. Fetch the final result
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
