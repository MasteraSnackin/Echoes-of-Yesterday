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
  submitAiAvatarRequest,
  getAiAvatarRequestStatus,
  type SubmitAiAvatarRequestInput, 
  type GetAiAvatarRequestStatusInput,
} from "@/ai/flows/ai-avatar";
import {
  submitAudioToVideoRequest,
  getAudioToVideoRequestStatus,
  type SubmitAudioToVideoRequestInput,
  type GetAudioToVideoRequestStatusInput,
} from "@/ai/flows/audio-to-video";
import {
  submitImageTo3dRequest,
  getImageTo3dRequestStatus,
  type SubmitImageTo3dRequestInput,
  type GetImageTo3dRequestStatusInput,
} from "@/ai/flows/image-to-3d";
import {
  submitImageToVideoKlingRequest,
  getImageToVideoKlingRequestStatus,
  type SubmitImageToVideoKlingRequestInput,
  type GetImageToVideoKlingRequestStatusInput,
} from "@/ai/flows/image-to-video-kling";


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

const submitAiAvatarSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required."),
  audioUrl: z.string().min(1, "Audio URL is required."),
  prompt: z.string().min(1, "Prompt is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
  num_frames: z.number().optional(),
  seed: z.number().optional(),
  turbo: z.boolean().optional(),
});

export async function submitAiAvatarRequestAction(input: SubmitAiAvatarRequestInput) {
    const validation = submitAiAvatarSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }
    return createResponse(submitAiAvatarRequest(validation.data));
}

const getAiAvatarStatusSchema = z.object({
  requestId: z.string().min(1, "Request ID is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function getAiAvatarRequestStatusAction(input: GetAiAvatarRequestStatusInput) {
    const validation = getAiAvatarStatusSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten().fieldErrors };
    }
    return createResponse(getAiAvatarRequestStatus(validation.data));
}

const submitAudioToVideoSchema = z.object({
  avatarId: z.string().min(1, "Avatar ID is required."),
  audioUrl: z.string().min(1, "Audio URL is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function submitAudioToVideoRequestAction(input: SubmitAudioToVideoRequestInput) {
  const validation = submitAudioToVideoSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(submitAudioToVideoRequest(validation.data));
}

const getAudioToVideoStatusSchema = z.object({
  requestId: z.string().min(1, "Request ID is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function getAudioToVideoRequestStatusAction(input: GetAudioToVideoRequestStatusInput) {
  const validation = getAudioToVideoStatusSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(getAudioToVideoRequestStatus(validation.data));
}

const submitImageTo3dSchema = z.object({
  imageUrl: z.string().min(1),
  apiKey: z.string().min(1),
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

export async function submitImageTo3dRequestAction(input: SubmitImageTo3dRequestInput) {
  const validation = submitImageTo3dSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(submitImageTo3dRequest(validation.data));
}

const getImageTo3dStatusSchema = z.object({
  requestId: z.string().min(1, "Request ID is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function getImageTo3dRequestStatusAction(input: GetImageTo3dRequestStatusInput) {
  const validation = getImageTo3dStatusSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(getImageTo3dRequestStatus(validation.data));
}

const submitImageToVideoKlingSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required."),
  prompt: z.string().min(1, "Prompt is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
  duration: z.enum(["5", "10"]).optional(),
  cfg_scale: z.number().min(0).max(1).optional(),
  negative_prompt: z.string().optional(),
});

export async function submitImageToVideoKlingRequestAction(input: SubmitImageToVideoKlingRequestInput) {
  const validation = submitImageToVideoKlingSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(submitImageToVideoKlingRequest(validation.data));
}

const getImageToVideoKlingStatusSchema = z.object({
  requestId: z.string().min(1, "Request ID is required."),
  apiKey: z.string().min(1, "Fal.ai API key is required."),
});

export async function getImageToVideoKlingRequestStatusAction(input: GetImageToVideoKlingRequestStatusInput) {
  const validation = getImageToVideoKlingStatusSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  return createResponse(getImageToVideoKlingRequestStatus(validation.data));
}