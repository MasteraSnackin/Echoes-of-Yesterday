'use server';
/**
 * @fileOverview This file contains flows for submitting and monitoring Image to 3D generation jobs with Fal.ai (Tripo3D).
 *
 * - submitImageTo3dRequest - Submits a job to the queue and returns a request ID.
 * - getImageTo3dRequestStatus - Checks the status of a job given a request ID.
 * - SubmitImageTo3dRequestInput - Input for submitting a job.
 * - GetImageTo3dRequestStatusInput - Input for checking job status.
 * - GetImageTo3dRequestStatusOutput - Output for job status check.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubmitImageTo3dRequestInputSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required."),
  apiKey: z.string().min(1, "API Key is required."),
  face_limit: z.number().optional(),
  style: z.string().optional(),
  pbr: z.boolean().optional(),
  texture: z.string().optional(),
  texture_alignment: z.string().optional(),
  auto_size: z.boolean().optional(),
  seed: z.number().optional(),
  quad: z.boolean().optional(),
  orientation: z.string().optional(),
  texture_seed: z.number().optional(),
});
export type SubmitImageTo3dRequestInput = z.infer<typeof SubmitImageTo3dRequestInputSchema>;

const SubmitImageTo3dRequestOutputSchema = z.object({
  requestId: z.string(),
});
export type SubmitImageTo3dRequestOutput = z.infer<typeof SubmitImageTo3dRequestOutputSchema>;


const GetImageTo3dRequestStatusInputSchema = z.object({
  requestId: z.string(),
  apiKey: z.string(),
});
export type GetImageTo3dRequestStatusInput = z.infer<typeof GetImageTo3dRequestStatusInputSchema>;

const GetImageTo3dRequestStatusOutputSchema = z.object({
  status: z.enum(['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'UNKNOWN']),
  logs: z.array(z.string()).optional(),
  error: z.string().optional().nullable(),
  renderedImageUrl: z.string().optional().nullable(),
  modelMeshUrl: z.string().optional().nullable(),
  pbrModelUrl: z.string().optional().nullable(),
});
export type GetImageTo3dRequestStatusOutput = z.infer<typeof GetImageTo3dRequestStatusOutputSchema>;


export async function submitImageTo3dRequest(input: SubmitImageTo3dRequestInput): Promise<SubmitImageTo3dRequestOutput> {
  return submitImageTo3dRequestFlow(input);
}

export async function getImageTo3dRequestStatus(input: GetImageTo3dRequestStatusInput): Promise<GetImageTo3dRequestStatusOutput> {
  return getImageTo3dRequestStatusFlow(input);
}


const submitImageTo3dRequestFlow = ai.defineFlow(
  {
    name: 'submitImageTo3dRequestFlow',
    inputSchema: SubmitImageTo3dRequestInputSchema,
    outputSchema: SubmitImageTo3dRequestOutputSchema,
  },
  async (input) => {
    const { apiKey, imageUrl, ...rest } = input;
    
    const requestBody: Record<string, any> = {
      image_url: imageUrl,
      ...rest,
    };
    
    const queueResponse = await fetch('https://queue.fal.run/tripo3d/tripo/v2.5/image-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        console.error(`Fal.ai (Tripo3D) Queue Submission Error: ${errorText}`);
        throw new Error(`Failed to submit to queue. Status: ${queueResponse.status}, Error: ${errorText}`);
    }

    const { request_id } = await queueResponse.json();
    if (!request_id) {
        throw new Error('Failed to get request ID from queue response.');
    }
    
    return { requestId: request_id };
  }
);


const getImageTo3dRequestStatusFlow = ai.defineFlow(
  {
    name: 'getImageTo3dRequestStatusFlow',
    inputSchema: GetImageTo3dRequestStatusInputSchema,
    outputSchema: GetImageTo3dRequestStatusOutputSchema,
  },
  async (input) => {
    const { requestId, apiKey } = input;
    const resultUrl = `https://queue.fal.run/tripo3d/tripo/v2.5/image-to-3d/requests/${requestId}`;
    
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
        
        if (!finalResult.model_mesh || !finalResult.model_mesh.url) {
            console.error("Incomplete response from Fal.ai (Tripo3D):", finalResult);
            return { status: 'FAILED', logs, error: `3D model generation completed, but the model URL is missing.` };
        }
        
        return { 
            status: 'COMPLETED',
            logs,
            renderedImageUrl: finalResult.rendered_image?.url,
            modelMeshUrl: finalResult.model_mesh?.url,
            pbrModelUrl: finalResult.pbr_model?.url,
        };
    } else if (statusResult.status === 'FAILED') {
        const resultData = await fetch(resultUrl).then(res => res.json()).catch(() => ({}));
        const finalLogs = (resultData.logs || []).map((log: any) => log.message);
        console.error('Fal.ai (Tripo3D) Failure Details:', resultData);
        const errorDetail = resultData?.detail || JSON.stringify(resultData);
        return { status: 'FAILED', logs: finalLogs, error: `3D model generation failed. Reason: ${errorDetail}` };
    }

    return {
        status: statusResult.status,
        logs,
        error: null,
    };
  }
);
