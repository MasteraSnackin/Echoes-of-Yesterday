'use server';
/**
 * @fileOverview A flow for cloning a voice from an audio file using the ElevenLabs API.
 *
 * - cloneVoice - Clones a voice from an audio file.
 * - CloneVoiceInput - The input type for the cloneVoice function.
 * - CloneVoiceOutput - The return type for the cloneVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CloneVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'An audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  fileName: z.string().describe('The name of the audio file.'),
  apiKey: z.string().describe('The ElevenLabs API key.'),
});
export type CloneVoiceInput = z.infer<typeof CloneVoiceInputSchema>;

const CloneVoiceOutputSchema = z.object({
  voiceId: z.string().describe('The ID of the cloned voice.'),
  message: z.string().describe('A message confirming the voice cloning status.'),
});
export type CloneVoiceOutput = z.infer<typeof CloneVoiceOutputSchema>;

export async function cloneVoice(input: CloneVoiceInput): Promise<CloneVoiceOutput> {
  return cloneVoiceFlow(input);
}

const cloneVoiceFlow = ai.defineFlow(
  {
    name: 'cloneVoiceFlow',
    inputSchema: CloneVoiceInputSchema,
    outputSchema: CloneVoiceOutputSchema,
  },
  async input => {
    const { audioDataUri, fileName, apiKey } = input;

    // Convert data URI to Blob
    const fetchResponse = await fetch(audioDataUri);
    const blob = await fetchResponse.blob();

    const formData = new FormData();
    formData.append('name', `Cloned Voice - ${new Date().toISOString()}`);
    formData.append('files', blob, fileName);
    formData.append('description', 'A voice cloned for the Echoes of Yesterday memorial.');

    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
        },
        body: formData,
    });

    if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        throw new Error(`Failed to clone voice. ElevenLabs API error: ${errorText}`);
    }

    const result = await elevenLabsResponse.json();
    
    if (!result.voice_id) {
        throw new Error('Cloning process did not return a voice ID.');
    }

    return { 
        voiceId: result.voice_id, 
        message: 'Voice cloned successfully.' 
    };
  }
);
