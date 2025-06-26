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
      'The data URI of the avatar image to use as a base, must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected description
    ),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImagePrompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateImageInputSchema},
  output: {schema: GenerateImageOutputSchema},
  prompt: `Generate an image based on the following prompt:

  {{prompt}}

  {{#if avatarDataUri}}
  Use the following avatar as a base image:
  {{media url=avatarDataUri}}
  {{/if}}`,
});

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
    } = input;

    const hasAvatar = avatarDataUri != null && avatarDataUri !== '';

    const promptInput = {
      prompt: prompt,
      ...(hasAvatar ? {avatarDataUri: avatarDataUri} : {}),
    };

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: hasAvatar
        ? [
            {media: {url: avatarDataUri!}},
            {text: prompt},
          ]
        : prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {imageDataUri: media!.url!};
  }
);
