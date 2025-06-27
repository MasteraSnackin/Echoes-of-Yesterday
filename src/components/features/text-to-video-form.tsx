"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateVideoAction } from '@/app/actions';
import { Loader2, Sparkles, Video } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function TextToVideoForm() {
  const [prompt, setPrompt] = useState<string>('A majestic lion roaring on a rocky outcrop at sunset, cinematic lighting');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);

  const handleGenerate = async () => {
    if (!prompt) {
      toast({ title: 'Please enter a prompt.', variant: 'destructive' });
      return;
    }

    if (!apiKey) {
      toast({
        title: 'Fal.ai API Key Missing',
        description: (
          <p>
            Please add your Fal.ai API key on the{' '}
            <Link href="/dashboard/account" className="underline font-bold">
              Account
            </Link>{' '}
            page.
          </p>
        ),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    const result = await generateVideoAction({
      prompt,
      apiKey,
    });
    setIsGenerating(false);

    if (result.success && result.data?.videoUrl) {
      setGeneratedVideo(result.data.videoUrl);
      toast({ title: 'Video generated successfully!' });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : 'An unknown error occurred.';
      toast({
        title: 'Error generating video',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Text-to-Video with Veo3</CardTitle>
          <CardDescription>
            Generate a short video from a text prompt using the Fal.ai Veo3 API. Videos can take a few minutes to generate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!apiKey && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fal.ai API Key Not Found</AlertTitle>
                <AlertDescription>
                Please go to the <Link href="/dashboard/account" className="font-bold underline">Account</Link> page to add your API key.
                </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A majestic lion roaring on a rocky outcrop at sunset..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating || !apiKey}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Video
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Result</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 rounded-b-lg p-2">
          {isGenerating ? (
            <div className="text-center text-muted-foreground animate-pulse">
                <Video className="mx-auto h-12 w-12" />
                <p className="mt-2 font-semibold">Generating video...</p>
                <p className="text-sm">This may take a few minutes. Please wait.</p>
            </div>
          ) : generatedVideo ? (
            <video
              src={generatedVideo}
              controls
              autoPlay
              loop
              className="w-full aspect-video rounded-md"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-center text-muted-foreground">
              <Video className="mx-auto h-12 w-12" />
              <p>Your generated video will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
