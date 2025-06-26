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
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI response message.'),
  audioResponseUri: z.string().describe('The AI spoken response in .wav format.').optional()
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithMemory(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  prompt: `You are simulating a conversation with a deceased loved one, using their memories and personality traits.

  Here are some memories and personality traits to use as the primary source of information:
  {{{integratedMemories}}}

  {% if userAvatarUri %}
  Here is the avatar of the person you are impersonating. Use it to guide the conversation and responses.
  {{media url=userAvatarUri}}
  {% endif %}

  User Input: {{{userInput}}}
  AI Response:`, 
});

import wav from 'wav';

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await chatPrompt(input);

    let audioResponseUri: string | undefined = undefined;
    if (input.clonedVoiceId) {
      const ttsResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
            },
          },
        },
        prompt: output?.aiResponse ?? ''
      });

      if (ttsResponse.media) {
        const audioBuffer = Buffer.from(
            ttsResponse.media.url.substring(ttsResponse.media.url.indexOf(',') + 1),
            'base64'
        );

        const wavDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer))

        audioResponseUri = wavDataUri;
      }
    }


    return {
      aiResponse: output?.aiResponse ?? 'No response generated.',
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

    let bufs = [] as any[];
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
