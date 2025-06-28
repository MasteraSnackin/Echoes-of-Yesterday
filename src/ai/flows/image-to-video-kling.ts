'use server';
/**
 * @fileOverview This file contains flows for submitting and monitoring Image to Video generation jobs with Fal.ai (Kling Video).
 *
 * - submitImageToVideoKlingRequest - Submits a job to the queue and returns a request ID.
 * - getImageToVideoKlingRequestStatus - Checks the status of a job given a request ID.
 * - SubmitImageToVideoKlingRequestInput - Input for submitting a job.
 * - GetImageToVideoKlingRequestStatusInput - Input for checking job status.
 * - GetImageToVideoKlingRequestStatusOutput - Output for job status check.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for submitting a request
const SubmitImageToVideoKlingRequestInputSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required."),
  prompt: z.string().min(1, "Prompt is required."),
  apiKey: z.string().min(1, "API Key is required."),
  duration: z.enum(["5", "10"]).optional().default("5"),
  cfg_scale: z.number().min(0).max(1).optional().default(0.5),
  negative_prompt: z.string().optional().default("blur, distort, and low quality"),
});
export type SubmitImageToVideoKlingRequestInput = z.infer<typeof SubmitImageToVideoKlingRequestInputSchema>;

const SubmitImageToVideoKlingRequestOutputSchema = z.object({
  requestId: z.string(),
});
export type SubmitImageToVideoKlingRequestOutput = z.infer<typeof SubmitImageToVideoKlingRequestOutputSchema>;


// Schemas for checking status
const GetImageToVideoKlingRequestStatusInputSchema = z.object({
  requestId: z.string(),
  apiKey: z.string(),
});
export type GetImageToVideoKlingRequestStatusInput = z.infer<typeof GetImageToVideoKlingRequestStatusInputSchema>;

const GetImageToVideoKlingRequestStatusOutputSchema = z.object({
  status: z.enum(['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'UNKNOWN']),
  videoUrl: z.string().optional().nullable(),
  logs: z.array(z.string()).optional(),
  error: z.string().optional().nullable(),
});
export type GetImageToVideoKlingRequestStatusOutput = z.infer<typeof GetImageToVideoKlingRequestStatusOutputSchema>;


// Wrapper functions to be called by server actions
export async function submitImageToVideoKlingRequest(input: SubmitImageToVideoKlingRequestInput): Promise<SubmitImageToVideoKlingRequestOutput> {
  return submitImageToVideoKlingRequestFlow(input);
}

export async function getImageToVideoKlingRequestStatus(input: GetImageToVideoKlingRequestStatusInput): Promise<GetImageToVideoKlingRequestStatusOutput> {
  return getImageToVideoKlingRequestStatusFlow(input);
}


// Flow for submitting the job
const submitImageToVideoKlingRequestFlow = ai.defineFlow(
  {
    name: 'submitImageToVideoKlingRequestFlow',
    inputSchema: SubmitImageToVideoKlingRequestInputSchema,
    outputSchema: SubmitImageToVideoKlingRequestOutputSchema,
  },
  async (input) => {
    const { apiKey, imageUrl, prompt, duration, cfg_scale, negative_prompt } = input;
    
    const requestBody: Record<string, any> = {
        image_url: imageUrl,
        prompt: prompt,
        duration: duration,
        cfg_scale: cfg_scale,
        negative_prompt: negative_prompt,
    };

    const queueResponse = await fetch('https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        console.error(`Fal.ai (Kling Video) Queue Submission Error: ${errorText}`);
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
const getImageToVideoKlingRequestStatusFlow = ai.defineFlow(
  {
    name: 'getImageToVideoKlingRequestStatusFlow',
    inputSchema: GetImageToVideoKlingRequestStatusInputSchema,
    outputSchema: GetImageToVideoKlingRequestStatusOutputSchema,
  },
  async (input) => {
    const { requestId, apiKey } = input;
    const resultUrl = `https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${requestId}`;
    
    const statusResponse = await fetch(`${resultUrl}/status`, {
        headers: { 'Authorization': `Key ${apiKey}` }
    });

    if (!statusResponse.ok) {
        console.warn(`Polling status failed with status: ${statusResponse.status}.`);
        return { status: 'UNKNOWN', logs: [`Polling status failed with status: ${statusResponse.status}`], error: "Polling failed." };
    }

    const statusResult = await statusResponse.json();
    const logs = (statusResult.logs || []).map((log: any) => log.message || log);

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
            console.error("Incomplete response from Fal.ai (Kling Video):", finalResult);
            return { status: 'FAILED', logs, error: `Video generation completed, but the video URL is missing.` };
        }
        
        return { 
            status: 'COMPLETED',
            videoUrl: finalResult.video.url,
            logs
        };
    } else if (statusResult.status === 'FAILED') {
        const resultData = await fetch(resultUrl).then(res => res.json()).catch(() => ({}));
        const finalLogs = (resultData.logs || []).map((log: any) => log.message || log);
        console.error('Fal.ai (Kling Video) Failure Details:', resultData);
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