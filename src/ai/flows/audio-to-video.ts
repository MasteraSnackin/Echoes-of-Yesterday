'use server';
/**
 * @fileOverview This file contains flows for submitting and monitoring Audio to Video generation jobs with Fal.ai (Veed Avatars).
 *
 * - submitAudioToVideoRequest - Submits a job to the queue and returns a request ID.
 * - getAudioToVideoRequestStatus - Checks the status of a job given a request ID.
 * - SubmitAudioToVideoRequestInput - Input for submitting a job.
 * - GetAudioToVideoRequestStatusInput - Input for checking job status.
 * - GetAudioToVideoRequestStatusOutput - Output for job status check.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for submitting a request
const SubmitAudioToVideoRequestInputSchema = z.object({
  avatarId: z.string().min(1, "Avatar ID is required."),
  audioUrl: z.string().min(1, "Audio URL is required."),
  apiKey: z.string().min(1, "API Key is required."),
});
export type SubmitAudioToVideoRequestInput = z.infer<typeof SubmitAudioToVideoRequestInputSchema>;

const SubmitAudioToVideoRequestOutputSchema = z.object({
  requestId: z.string(),
});
export type SubmitAudioToVideoRequestOutput = z.infer<typeof SubmitAudioToVideoRequestOutputSchema>;


// Schemas for checking status
const GetAudioToVideoRequestStatusInputSchema = z.object({
  requestId: z.string(),
  apiKey: z.string(),
});
export type GetAudioToVideoRequestStatusInput = z.infer<typeof GetAudioToVideoRequestStatusInputSchema>;

const GetAudioToVideoRequestStatusOutputSchema = z.object({
  status: z.enum(['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'UNKNOWN']),
  videoUrl: z.string().optional().nullable(),
  logs: z.array(z.string()).optional(),
  error: z.string().optional().nullable(),
});
export type GetAudioToVideoRequestStatusOutput = z.infer<typeof GetAudioToVideoRequestStatusOutputSchema>;


// Wrapper functions to be called by server actions
export async function submitAudioToVideoRequest(input: SubmitAudioToVideoRequestInput): Promise<SubmitAudioToVideoRequestOutput> {
  return submitAudioToVideoRequestFlow(input);
}

export async function getAudioToVideoRequestStatus(input: GetAudioToVideoRequestStatusInput): Promise<GetAudioToVideoRequestStatusOutput> {
  return getAudioToVideoRequestStatusFlow(input);
}


// Flow for submitting the job
const submitAudioToVideoRequestFlow = ai.defineFlow(
  {
    name: 'submitAudioToVideoRequestFlow',
    inputSchema: SubmitAudioToVideoRequestInputSchema,
    outputSchema: SubmitAudioToVideoRequestOutputSchema,
  },
  async (input) => {
    const { apiKey, avatarId, audioUrl } = input;
    
    const requestBody: Record<string, any> = {
        avatar_id: avatarId,
        audio_url: audioUrl,
    };

    const queueResponse = await fetch('https://queue.fal.run/veed/avatars/audio-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        console.error(`Fal.ai (Veed) Queue Submission Error: ${errorText}`);
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
const getAudioToVideoRequestStatusFlow = ai.defineFlow(
  {
    name: 'getAudioToVideoRequestStatusFlow',
    inputSchema: GetAudioToVideoRequestStatusInputSchema,
    outputSchema: GetAudioToVideoRequestStatusOutputSchema,
  },
  async (input) => {
    const { requestId, apiKey } = input;
    const resultUrl = `https://queue.fal.run/veed/avatars/audio-to-video/requests/${requestId}`;
    
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
            console.error("Incomplete response from Fal.ai (Veed):", finalResult);
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
        console.error('Fal.ai (Veed) Failure Details:', resultData);
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
