'use server';

/**
 * @fileOverview Implements the chat interface flow, integrating avatar, voice, and memories for a simulated conversation.
 *
 * - chatWithMemory - A function that handles the chat process with memory integration.
 * - ChatInput - The input type for the chatWithMemory function.
 * - ChatOutput - The return type for the chatWithMemory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const ChatInputSchema = z.object({
  userInput: z.string().describe('The user input message.'),
  userAvatarUri: z
    .string()
    .describe(
      'The data URI of the user-selected avatar. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    )
    .optional(),
  clonedVoiceId: z.string().describe('The ID of the cloned voice from ElevenLabs.').optional(),
  integratedMemories: z.string().describe('The integrated memories of the loved one.'),
  elevenLabsApiKey: z.string().describe('The ElevenLabs API key.').optional(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI response message.'),
  audioResponseUri: z.string().describe('The AI spoken response in audio/mpeg or audio/wav format.').optional()
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithMemory(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: z.object({ aiResponse: z.string() })},
  prompt: `You are simulating a conversation with a deceased loved one, using their memories and personality traits.

  Here are some memories and personality traits to use as the primary source of information:
  {{{integratedMemories}}}

  {{#if userAvatarUri}}
  Here is the avatar of the person you are impersonating. Use it to guide the conversation and responses.
  {{media url=userAvatarUri}}
  {{/if}}

  User Input: {{{userInput}}}
  AI Response:`, 
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await chatPrompt(input);
    const aiResponse = output?.aiResponse ?? 'I am not sure how to respond to that.';

    let audioResponseUri: string | undefined = undefined;

    // Use ElevenLabs if voice ID and API key are provided
    if (input.clonedVoiceId && input.elevenLabsApiKey) {
      try {
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${input.clonedVoiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': input.elevenLabsApiKey,
                'accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: aiResponse,
                model_id: 'eleven_multilingual_v2',
            }),
        });

        if (ttsResponse.ok) {
            const audioBuffer = await ttsResponse.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');
            audioResponseUri = `data:audio/mpeg;base64,${base64Audio}`;
        } else {
            const error = await ttsResponse.json();
            console.error("ElevenLabs TTS error:", error);
        }
      } catch (error) {
        console.error("Failed to generate audio from ElevenLabs:", error);
      }
    } else {
      // Fallback to Genkit TTS for testing/demo purposes
      try {
        const {media} = await ai.generate({
          model: googleAI.model('gemini-2.5-flash-preview-tts'),
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {voiceName: 'Algenib'}, // A standard, pleasant voice
              },
            },
          },
          prompt: aiResponse,
        });

        if (media?.url) {
          const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
          );
          audioResponseUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
        } else {
            console.error("Genkit TTS error: No media returned");
        }
      } catch (error) {
        console.error("Failed to generate audio from Genkit TTS:", error);
      }
    }

    return {
      aiResponse: aiResponse,
      audioResponseUri: audioResponseUri
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
