"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateAiAvatarAction } from '@/app/actions';
import { Loader2, Sparkles, Video, AlertTriangle, ChevronDown } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function VideoAvatarForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('A woman with colorful hair talking on a podcast.');
  
  const [numFrames, setNumFrames] = useState(145);
  const [seed, setSeed] = useState(42);
  const [turbo, setTurbo] = useState(true);

  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setImageUrl(uri);
      }
  };
  
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setAudioUrl(uri);
          setAudioPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleGenerate = async () => {
    if (!imageUrl || !audioUrl) {
      toast({ title: 'Please upload an image and an audio file.', variant: 'destructive' });
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
    toast({ title: "Video generation started...", description: "This can take a few minutes."});

    const result = await generateAiAvatarAction({
      imageUrl,
      audioUrl,
      prompt,
      apiKey,
      num_frames: numFrames,
      seed: seed,
      turbo: turbo,
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
          <CardTitle className="font-headline text-2xl">Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageFileChange} disabled={!apiKey || isGenerating} />
          </div>
          {imageUrl && (
            <div className="aspect-square relative w-48 mx-auto rounded-lg overflow-hidden border">
                <Image src={imageUrl} alt="Uploaded image" layout="fill" objectFit="contain" />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="audio-upload">Audio</Label>
            <Input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioFileChange} disabled={!apiKey || isGenerating} />
          </div>
           {audioPreviewUrl && (
            <div className="space-y-2">
                <audio controls src={audioPreviewUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A person talking..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating || !apiKey}
            />
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 flex items-center gap-1">
                    <ChevronDown className="h-4 w-4" />
                    Advanced settings
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="num_frames">Number of Frames: {numFrames}</Label>
                    <Slider
                        id="num_frames"
                        min={41}
                        max={251}
                        step={1}
                        value={[numFrames]}
                        onValueChange={(value) => setNumFrames(value[0])}
                        disabled={isGenerating || !apiKey}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="seed">Seed</Label>
                    <Input
                        id="seed"
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        disabled={isGenerating || !apiKey}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="turbo"
                        checked={turbo}
                        onCheckedChange={setTurbo}
                        disabled={isGenerating || !apiKey}
                    />
                    <Label htmlFor="turbo">Turbo Mode</Label>
                </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !imageUrl || !audioUrl} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Run
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
              muted
              playsInline
              className="w-full aspect-square rounded-md object-cover"
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
