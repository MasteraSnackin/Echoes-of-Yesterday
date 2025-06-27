"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateAiAvatarVideoAction } from '@/app/actions';
import { Loader2, Clapperboard, Video } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function AiAvatarMultiForm() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [firstAudioDataUri, setFirstAudioDataUri] = useState<string | null>(null);
  const [secondAudioDataUri, setSecondAudioDataUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('A smiling man and woman wearing headphones sit in front of microphones, appearing to host a podcast.');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (uri: string | null) => void) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setter(uri);
      } else {
          setter(null);
      }
  };

  const handleGenerate = async () => {
    if (!imageDataUri || !firstAudioDataUri) {
      toast({ title: 'Please provide an image and at least one audio file.', variant: 'destructive' });
      return;
    }
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
    const result = await generateAiAvatarVideoAction({
      apiKey,
      prompt,
      imageDataUri,
      firstAudioDataUri,
      secondAudioDataUri: secondAudioDataUri || undefined,
    });
    setIsGenerating(false);

    if (result.success && result.data?.videoUrl) {
      setGeneratedVideo(result.data.videoUrl);
      toast({ title: 'Video generated successfully!' });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
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
          <CardTitle className="font-headline text-2xl">Input</CardTitle>
          <CardDescription>
            Provide an image, one or two audio files, and a prompt to generate the video.
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
            <Label htmlFor="image-upload">Image</Label>
            <Input id="image-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setImageDataUri)} disabled={!apiKey || isGenerating} />
          </div>
          {imageDataUri && (
            <div className="aspect-video relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
                <Image src={imageDataUri} alt="Uploaded image" layout="fill" objectFit="contain" />
            </div>
          )}
           <div className="space-y-2">
            <Label htmlFor="audio1-upload">First Audio File</Label>
            <Input id="audio1-upload" type="file" accept="audio/*" onChange={(e) => handleFileChange(e, setFirstAudioDataUri)} disabled={!apiKey || isGenerating} />
            {firstAudioDataUri && <audio controls src={firstAudioDataUri} className="w-full mt-2" />}
          </div>
           <div className="space-y-2">
            <Label htmlFor="audio2-upload">Second Audio File (Optional)</Label>
            <Input id="audio2-upload" type="file" accept="audio/*" onChange={(e) => handleFileChange(e, setSecondAudioDataUri)} disabled={!apiKey || isGenerating} />
             {secondAudioDataUri && <audio controls src={secondAudioDataUri} className="w-full mt-2" />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="A smiling man and woman wearing headphones..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating || !apiKey}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !imageDataUri || !firstAudioDataUri} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}
            Generate Video
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Output</CardTitle>
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
