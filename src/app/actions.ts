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
import {
  cloneVoice,
  type CloneVoiceInput,
} from "@/ai/flows/voice-cloning";
import {
  speechToText,
  type SpeechToTextInput,
} from "@/ai/flows/speech-to-text";
import {
  textToSpeech,
  type TextToSpeechInput,
} from "@/ai/flows/text-to-speech";
import {
  generateVideo,
  type GenerateVideoInput,
} from "@/ai/flows/generate-video";
import {
  imageToVideo,
  type ImageToVideoInput,
} from "@/ai/flows/image-to-video";
import {
  imageToVideoPixverse,
  type ImageToVideoPixverseInput,
} from "@/ai/flows/image-to-video-pixverse";

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
  count: z.number().optional(),
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
    elevenLabsApiKey: z.string().optional(),
});

export async function chatAction(input: ChatInput) {
    const validation = chatSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }
    return createResponse(chatWithMemory(validation.data));
}

const voiceSchema = z.object({
  audioDataUri: z.string().min(1, "Audio data cannot be empty."),
  fileName: z.string().min(1, "File name cannot be empty."),
  apiKey: z.string().min(1, "ElevenLabs API key is required."),
});

export async function cloneVoiceAction(input: CloneVoiceInput) {
  const validation = voiceSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(cloneVoice(validation.data));
}

const speechToTextSchema = z.object({
  audioDataUri: z.string().min(1, "Audio data cannot be empty."),
});

export async function speechToTextAction(input: SpeechToTextInput) {
  const validation = speechToTextSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(speechToText(validation.data));
}

const ttsSchema = z.object({
  text: z.string().min(1, "Text cannot be empty."),
  voiceId: z.string().min(1, "Voice ID is required."),
  apiKey: z.string().min(1, "ElevenLabs API key is required."),
});

export async function textToSpeechAction(input: TextToSpeechInput) {
  const validation = ttsSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(textToSpeech(validation.data));
}

const videoSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function generateVideoAction(input: GenerateVideoInput) {
  const validation = videoSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(generateVideo(validation.data));
}

const imageToVideoSchema = z.object({
  imageUrl: z.string().min(1, "Image URL cannot be empty."),
  prompt: z.string().optional(),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function imageToVideoAction(input: ImageToVideoInput) {
  const validation = imageToVideoSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(imageToVideo(validation.data));
}

const imageToVideoPixverseSchema = z.object({
  imageUrl: z.string().min(1, "Image URL cannot be empty."),
  prompt: z.string().optional(),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function imageToVideoPixverseAction(input: ImageToVideoPixverseInput) {
  const validation = imageToVideoPixverseSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(imageToVideoPixverse(validation.data));
}
