import axios from 'axios';

interface GenerateAIAvatarInput {
  apiKey: string;
  imageUrl: string;
  firstAudioUrl: string;
  secondAudioUrl: string;
  prompt: string;
  numFrames?: number;
  seed?: number;
  turbo?: boolean;
}

interface FalAIResponse {
  request_id: string;
  // Other potential fields on initial response
}

interface FalAIStatusResponse {
  status: string; // e.g., "COMPLETED", "IN_PROGRESS", "FAILED"
  // Other potential fields on status response
}

interface FalAIResultResponse {
  video: {
    url: string;
    // Other video file properties
  };
  seed: number;
}

export async function generateAIAvatar({
  apiKey,
  imageUrl,
  firstAudioUrl,
  secondAudioUrl,
  prompt,
  numFrames,
  seed,
  turbo,
}: GenerateAIAvatarInput): Promise<string | null> {
  const apiUrl = 'https://queue.fal.run/fal-ai/ai-avatar/multi';

  try {
    // Submit the request
    const submitResponse = await axios.post<FalAIResponse>(
      apiUrl,
      {
        image_url: imageUrl,
        first_audio_url: firstAudioUrl,
        second_audio_url: secondAudioUrl,
        prompt: prompt,
        num_frames: numFrames,
        seed: seed,
        turbo: turbo,
      },
      {
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { request_id } = submitResponse.data;

    if (!request_id) {
      console.error('Failed to get request_id from initial response.');
      return null;
    }

    // Poll for status
    let status = '';
    while (status !== 'COMPLETED' && status !== 'FAILED') {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds

      const statusResponse = await axios.get<FalAIStatusResponse>(
        `https://queue.fal.run/fal-ai/ai-avatar/requests/${request_id}/status`,
        {
          headers: {
            Authorization: `Key ${apiKey}`,
          },
        }
      );
      status = statusResponse.data.status;
      console.log(`Request ${request_id} status: ${status}`);
    }

    if (status === 'FAILED') {
      console.error(`AI Avatar generation failed for request_id: ${request_id}`);
      return null;
    }

    // Get the result
    const resultResponse = await axios.get<FalAIResultResponse>(
      `https://queue.fal.run/fal-ai/ai-avatar/requests/${request_id}`,
      {
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      }
    );

    return resultResponse.data.video.url;

  } catch (error) {
    console.error('Error generating AI Avatar:', error);
    return null;
  }
}