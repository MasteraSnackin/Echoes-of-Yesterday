'use server';
/**
 * @fileOverview A flow for cloning a voice from an audio file using the ElevenLabs API directly.
 *
 * - cloneVoice - Clones a voice from an audio file.
 * - CloneVoiceInput - The input type for the cloneVoice function.
 * - CloneVoiceOutput - The return type for the cloneVoice function.
 */

import {z} from 'zod';

const CloneVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'An audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  fileName: z.string().describe('The name of the audio file.'),
  apiKey: z.string().describe('The ElevenLabs API key.'),
  voiceName: z.string().optional().describe('Custom name for the cloned voice.'),
  description: z.string().optional().describe('Description for the cloned voice.'),
});
export type CloneVoiceInput = z.infer<typeof CloneVoiceInputSchema>;

const CloneVoiceOutputSchema = z.object({
  voiceId: z.string().describe('The ID of the cloned voice.'),
  message: z.string().describe('A message confirming the voice cloning status.'),
});
export type CloneVoiceOutput = z.infer<typeof CloneVoiceOutputSchema>;

export async function cloneVoice(input: CloneVoiceInput): Promise<CloneVoiceOutput> {
  const { audioDataUri, fileName, apiKey, voiceName, description } = input;

  try {
    // Convert data URI to Blob
    const response = await fetch(audioDataUri);
    const blob = await response.blob();

    // Create FormData for ElevenLabs API
    const formData = new FormData();
    formData.append('name', voiceName || `Cloned Voice - ${new Date().toISOString()}`);
    formData.append('files', blob, fileName);
    formData.append('description', description || 'A voice cloned for the Echoes of Yesterday memorial.');

    // Call ElevenLabs Voice Cloning API directly
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      let errorMessage = `Failed to clone voice. ElevenLabs API error: ${errorText}`;
      
      // Parse common ElevenLabs errors
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          if (typeof errorJson.detail === 'string') {
            errorMessage = errorJson.detail;
          } else if (errorJson.detail.message) {
            errorMessage = errorJson.detail.message;
          }
        }
      } catch (e) {
        // Keep original error message if parsing fails
      }
      
      throw new Error(errorMessage);
    }

    const result = await elevenLabsResponse.json();
    
    if (!result.voice_id) {
      throw new Error('Voice cloning completed but no voice ID was returned. Please try again.');
    }

    return { 
      voiceId: result.voice_id, 
      message: 'Voice cloned successfully with ElevenLabs! You can now use this voice in the chat interface.' 
    };
  } catch (error) {
    // Re-throw with more user-friendly error messages
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred during voice cloning. Please try again.');
  }
}