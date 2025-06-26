"use server";

import { z } from "zod";
import {
  memoryIntegration,
  type MemoryIntegrationInput,
} from "@/ai/flows/memory-integration";
import {
  generateImage,
  type GenerateImageInput,
} from "@/ai/flows/generate-image";
import { 
  chatWithMemory, 
  type ChatInput 
} from "@/ai/flows/chat-interface";

// Helper to create a standardized response
function createResponse<T>(promise: Promise<T>) {
  return promise
    .then((data) => ({ success: true, data }))
    .catch((error) => ({ success: false, error: error.message || "An unknown error occurred." }));
}

const memorySchema = z.object({
  memories: z.string().min(1, "Memories cannot be empty."),
});

export async function saveMemoriesAction(input: MemoryIntegrationInput) {
  const validation = memorySchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(memoryIntegration(validation.data));
}

const imageSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty."),
  avatarDataUri: z.string().optional(),
});

export async function generateImageAction(input: GenerateImageInput) {
  const validation = imageSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(generateImage(validation.data));
}

const chatSchema = z.object({
    userInput: z.string().min(1),
    userAvatarUri: z.string().optional(),
    clonedVoiceId: z.string().optional(),
    integratedMemories: z.string(),
});

export async function chatAction(input: ChatInput) {
    const validation = chatSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }
    return createResponse(chatWithMemory(validation.data));
}
