// src/ai/flows/generate-image.ts
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt, optionally using an avatar as a base image.
 *
 * - generateImage - A function that generates an image based on the provided prompt and avatar.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to use for image generation.'),
  avatarDataUri: z
    .string()
    .optional()
    .describe(
      'The data URI of the avatar image to use as a base, must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  count: z.number().optional().default(1).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUris: z.array(z.string()).describe('The data URIs of the generated images.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async input => {
    const {
      prompt,
      avatarDataUri,
      count,
    } = input;

    const hasAvatar = avatarDataUri != null && avatarDataUri !== '';

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: hasAvatar
        ? [
            {media: {url: avatarDataUri!}},
            {text: prompt},
          ]
        : prompt,
      candidates: count,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    const imageDataUris = (response.candidates ?? [])
        .map(candidate => candidate.output?.media?.url)
        .filter((url): url is string => !!url);

    // Fallback for single image generation if candidates array is empty
    if (imageDataUris.length === 0 && response.media?.url) {
        imageDataUris.push(response.media.url);
    }

    return { imageDataUris };
  }
);