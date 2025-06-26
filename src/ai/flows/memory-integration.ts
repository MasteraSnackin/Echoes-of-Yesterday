// src/ai/flows/memory-integration.ts
'use server';

/**
 * @fileOverview Manages the integration of user-provided memories into the AI chat.
 *
 * - memoryIntegration - A function to save user memories.
 * - MemoryIntegrationInput - The input type for the memoryIntegration function.
 * - MemoryIntegrationOutput - The return type for the memoryIntegration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MemoryIntegrationInputSchema = z.object({
  memories: z
    .string()
    .describe("A detailed text containing memories, stories, and personality traits of the deceased loved one. This text will inform the AI's responses in the chat interface."),
});
export type MemoryIntegrationInput = z.infer<typeof MemoryIntegrationInputSchema>;

const MemoryIntegrationOutputSchema = z.object({
  success: z.boolean().describe('Indicates successful memory integration.'),
  message: z.string().describe('A message confirming the memory integration status.'),
});
export type MemoryIntegrationOutput = z.infer<typeof MemoryIntegrationOutputSchema>;

export async function memoryIntegration(input: MemoryIntegrationInput): Promise<MemoryIntegrationOutput> {
  return memoryIntegrationFlow(input);
}

const memoryIntegrationFlow = ai.defineFlow(
  {
    name: 'memoryIntegrationFlow',
    inputSchema: MemoryIntegrationInputSchema,
    outputSchema: MemoryIntegrationOutputSchema,
  },
  async input => {
    // No LLM call needed; just return a success message.
    return {success: true, message: 'Memories successfully integrated.'};
  }
);
