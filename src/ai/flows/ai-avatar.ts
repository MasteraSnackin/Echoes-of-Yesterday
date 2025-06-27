'use server';
/**
 * @fileOverview This file contains flows for submitting and monitoring AI Avatar video generation jobs with Fal.ai.
 *
 * - submitAiAvatarRequest - Submits a job to the queue and returns a request ID.
 * - getAiAvatarRequestStatus - Checks the status of a job given a request ID.
 * - SubmitAiAvatarRequestInput - Input for submitting a job.
 * - GetAiAvatarRequestStatusInput - Input for checking job status.
 * - GetAiAvatarRequestStatusOutput - Output for job status check.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for submitting a request
const SubmitAiAvatarRequestInputSchema = z.object({
  imageUrl: z.string().min(1,"Image URL is required."),
  audioUrl: z.string().min(1, "Audio URL is required."),
  prompt: z.string().min(1, "Prompt is required."),
  apiKey: z.string().min(1, "API Key is required."),
  num_frames: z.number().optional(),
  seed: z.number().optional(),
  turbo: z.boolean().optional(),
});
export type SubmitAiAvatarRequestInput = z.infer<typeof SubmitAiAvatarRequestInputSchema>;

const SubmitAiAvatarRequestOutputSchema = z.object({
  requestId: z.string(),
});
export type SubmitAiAvatarRequestOutput = z.infer<typeof SubmitAiAvatarRequestOutputSchema>;


// Schemas for checking status
const GetAiAvatarRequestStatusInputSchema = z.object({
  requestId: z.string(),
  apiKey: z.string(),
});
export type GetAiAvatarRequestStatusInput = z.infer<typeof GetAiAvatarRequestStatusInputSchema>;

const GetAiAvatarRequestStatusOutputSchema = z.object({
  status: z.enum(['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'UNKNOWN']),
  videoUrl: z.string().optional().nullable(),
  logs: z.array(z.string()).optional(),
  error: z.string().optional().nullable(),
});
export type GetAiAvatarRequestStatusOutput = z.infer<typeof GetAiAvatarRequestStatusOutputSchema>;


// Wrapper functions to be called by server actions
export async function submitAiAvatarRequest(input: SubmitAiAvatarRequestInput): Promise<SubmitAiAvatarRequestOutput> {
  return submitAiAvatarRequestFlow(input);
}

export async function getAiAvatarRequestStatus(input: GetAiAvatarRequestStatusInput): Promise<GetAiAvatarRequestStatusOutput> {
  return getAiAvatarRequestStatusFlow(input);
}


// Flow for submitting the job
const submitAiAvatarRequestFlow = ai.defineFlow(
  {
    name: 'submitAiAvatarRequestFlow',
    inputSchema: SubmitAiAvatarRequestInputSchema,
    outputSchema: SubmitAiAvatarRequestOutputSchema,
  },
  async (input) => {
    const { apiKey, imageUrl, audioUrl, prompt, num_frames, seed, turbo } = input;
    
    const requestBody: Record<string, any> = {
        image_url: imageUrl,
        audio_url: audioUrl,
        prompt: prompt,
    };

    if (num_frames) requestBody.num_frames = num_frames;
    if (seed) requestBody.seed = seed;
    if (turbo !== undefined) requestBody.turbo = turbo;

    const queueResponse = await fetch('https://queue.fal.run/fal-ai/ai-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        console.error(`Fal.ai Queue Submission Error: ${errorText}`);
        throw new Error(`Failed to submit to queue. Status: ${queueResponse.status}, Error: ${errorText}`);
    }

    const { request_id } = await queueResponse.json();
    if (!request_id) {
        throw new Error('Failed to get request ID from queue response.');
    }
    
    return { requestId: request_id };
  }
);


// Flow for checking the job status
const getAiAvatarRequestStatusFlow = ai.defineFlow(
  {
    name: 'getAiAvatarRequestStatusFlow',
    inputSchema: GetAiAvatarRequestStatusInputSchema,
    outputSchema: GetAiAvatarRequestStatusOutputSchema,
  },
  async (input) => {
    const { requestId, apiKey } = input;
    const resultUrl = `https://queue.fal.run/fal-ai/ai-avatar/requests/${requestId}`;
    
    const statusResponse = await fetch(`${resultUrl}/status`, {
        headers: { 'Authorization': `Key ${apiKey}` }
    });

    if (!statusResponse.ok) {
        console.warn(`Polling status failed with status: ${statusResponse.status}.`);
        return { status: 'UNKNOWN', logs: [`Polling status failed with status: ${statusResponse.status}`], error: "Polling failed." };
    }

    const statusResult = await statusResponse.json();
    const logs = (statusResult.logs || []).map((log: any) => log.message);

    if (statusResult.status === 'COMPLETED') {
        const resultResponse = await fetch(resultUrl, {
            headers: { 'Authorization': `Key ${apiKey}` }
        });
        
        if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            return { status: 'FAILED', logs, error: `Failed to fetch final result. Status: ${resultResponse.status}, Error: ${errorText}` };
        }

        const finalResult = await resultResponse.json();
        
        if (!finalResult.video || !finalResult.video.url) {
            console.error("Incomplete response from Fal.ai:", finalResult);
            return { status: 'FAILED', logs, error: `Video generation completed, but the video URL is missing.` };
        }
        
        return { 
            status: 'COMPLETED',
            videoUrl: finalResult.video.url,
            logs
        };
    } else if (statusResult.status === 'FAILED') {
        const resultData = await fetch(resultUrl).then(res => res.json()).catch(() => ({}));
        const finalLogs = (resultData.logs || []).map((log: any) => log.message);
        console.error('Fal.ai Failure Details:', resultData);
        const errorDetail = resultData?.detail || JSON.stringify(resultData);
        return { status: 'FAILED', logs: finalLogs, error: `Video generation failed. Reason: ${errorDetail}` };
    }

    // Return IN_PROGRESS or IN_QUEUE status
    return {
        status: statusResult.status,
        logs,
        videoUrl: null,
        error: null,
    };
  }
);
