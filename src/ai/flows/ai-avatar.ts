'use server';
/**
 * @fileOverview A flow for generating a video avatar from an image and audio using the fal.ai/ai-avatar API.
 *
 * - generateAiAvatar - Generates a video from an image, audio, and prompt.
 * - AiAvatarInput - The input type for the generateAiAvatar function.
 * - AiAvatarOutput - The return type for the generateAiAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAvatarInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The source image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audioUrl: z
    .string()
    .describe(
      "The source audio as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt to guide video generation.'),
  apiKey: z.string().describe('The Fal.ai API key.'),
});
export type AiAvatarInput = z.infer<typeof AiAvatarInputSchema>;

const AiAvatarOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type AiAvatarOutput = z.infer<typeof AiAvatarOutputSchema>;

export async function generateAiAvatar(input: AiAvatarInput): Promise<AiAvatarOutput> {
  return aiAvatarFlow(input);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const aiAvatarFlow = ai.defineFlow(
  {
    name: 'aiAvatarFlow',
    inputSchema: AiAvatarInputSchema,
    outputSchema: AiAvatarOutputSchema,
  },
  async input => {
    const { apiKey, ...body } = input;
    const { imageUrl, audioUrl, prompt } = body;

    // 1. Submit the request to the queue
    const queueResponse = await fetch('https://queue.fal.run/fal-ai/ai-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image_url: imageUrl,
        audio_url: audioUrl,
        prompt: prompt,
      }),
    });

    if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        throw new Error(`Failed to submit to queue. Status: ${queueResponse.status}, Error: ${errorText}`);
    }

    const { request_id } = await queueResponse.json();
    if (!request_id) {
        throw new Error('Failed to get request ID from queue response.');
    }

    const statusUrl = `https://queue.fal.run/fal-ai/ai-avatar/requests/${request_id}/status`;
    const resultUrl = `https://queue.fal.run/fal-ai/ai-avatar/requests/${request_id}`;
    
    // 2. Poll for the result
    const maxAttempts = 100; // ~5 minutes
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await sleep(3000); // Wait for 3 seconds between polls
        const statusCheck = await fetch(statusUrl, {
            headers: { 'Authorization': `Key ${apiKey}` }
        });

        if (!statusCheck.ok) continue; // Retry if status check fails

        const statusResult = await statusCheck.json();
        
        if (statusResult.status === 'COMPLETED') {
            const resultResponse = await fetch(resultUrl, {
                headers: { 'Authorization': `Key ${apiKey}` }
            });
            
            if (!resultResponse.ok) {
                const errorText = await resultResponse.text();
                throw new Error(`Failed to fetch final result. Status: ${resultResponse.status}, Error: ${errorText}`);
            }

            const finalResult = await resultResponse.json();
            if (!finalResult.video || !finalResult.video.url) {
                console.error("Incomplete response from Fal.ai:", finalResult);
                throw new Error("Video generation completed, but the video URL is missing.");
            }
            
            return { videoUrl: finalResult.video.url };
        } else if (statusResult.status === 'IN_PROGRESS' || statusResult.status === 'IN_QUEUE') {
            // Continue polling
        } else {
            // Handle error states like FAILED, etc.
            throw new Error(`Video generation failed with status: ${statusResult.status}. Logs: ${JSON.stringify(statusResult.logs)}`);
        }
    }

    throw new Error('Video generation timed out.');
  }
);
