"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { avatarToVideoAction } from '@/app/actions';
import { Loader2, Video, User, Clapperboard } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import { useAvatarStore } from '@/lib/store/avatar';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function AvatarToVideoForm() {
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);
  const avatarUri = useHydratedStore(useAvatarStore, (state) => state.selectedAvatarUri);

  const handleGenerate = async () => {
    if (!avatarUri) {
      toast({
        title: 'Active Avatar Missing',
        description: (
          <p>
            Please set an active avatar on the{' '}
            <Link href="/dashboard/avatar-generation" className="underline font-bold">
              Avatar Generation
            </Link>{' '}
            page first.
          </p>
        ),
        variant: 'destructive',
      });
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
    const result = await avatarToVideoAction({
      avatarDataUri: avatarUri,
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
          <CardTitle className="font-headline text-2xl">Animate Your Avatar</CardTitle>
          <CardDescription>
            Bring your active avatar to life. This tool will generate a short, looping video from the image. This can take several minutes.
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

          <CardTitle className="text-lg font-semibold">Active Avatar</CardTitle>
          {avatarUri ? (
             <div className="relative w-48 h-48 rounded-md border p-2">
                <Image src={avatarUri} alt="Active Avatar" layout="fill" objectFit="cover" className="rounded-md" />
             </div>
          ) : (
            <Alert>
                <User className="h-4 w-4" />
                <AlertTitle>No Active Avatar</AlertTitle>
                <AlertDescription>
                    Go to the <Link href="/dashboard/avatar-generation" className="font-bold underline">Avatar Generation</Link> page to create and select an avatar.
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !avatarUri} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}
            Animate Avatar
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
              muted
              playsInline
              className="w-full aspect-square rounded-md object-cover"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-center text-muted-foreground">
              <Video className="mx-auto h-12 w-12" />
              <p>Your animated avatar will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
