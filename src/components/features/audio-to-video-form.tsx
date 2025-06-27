"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitAudioToVideoRequestAction, getAudioToVideoRequestStatusAction } from '@/app/actions';
import { Loader2, Sparkles, Video, AlertTriangle, PersonStanding } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const veedAvatars = [
  "emily_vertical_primary","emily_vertical_secondary","marcus_vertical_primary","marcus_vertical_secondary",
  "mira_vertical_primary","mira_vertical_secondary","jasmine_vertical_primary","jasmine_vertical_secondary",
  "jasmine_vertical_walking","aisha_vertical_walking","elena_vertical_primary","elena_vertical_secondary",
  "any_male_vertical_primary","any_female_vertical_primary","any_male_vertical_secondary","any_female_vertical_secondary",
  "any_female_vertical_walking","emily_primary","emily_side","marcus_primary","marcus_side","aisha_walking",
  "elena_primary","elena_side","any_male_primary","any_female_primary","any_male_side","any_female_side"
];


export function AudioToVideoForm() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string>(veedAvatars[0]);

  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);

  // Effect to clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Effect to handle the polling logic
  useEffect(() => {
    if (requestId && isPolling && apiKey) {
      pollingIntervalRef.current = setInterval(async () => {
        const result = await getAudioToVideoRequestStatusAction({ requestId, apiKey });

        if (result.success && result.data) {
          const { status, logs: newLogs, videoUrl, error } = result.data;
          
          if (newLogs) {
            setLogs(newLogs);
          }

          if (status === 'COMPLETED' && videoUrl) {
            setIsPolling(false);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setGeneratedVideo(videoUrl);
            toast({ title: 'Video generated successfully!' });
          } else if (status === 'FAILED') {
            setIsPolling(false);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            toast({ title: 'Error generating video', description: error || 'An unknown error occurred.', variant: 'destructive' });
          }
        } else {
          setIsPolling(false);
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          toast({ title: 'Error checking status', description: result.error as string, variant: 'destructive' });
        }
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [requestId, isPolling, apiKey, toast]);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setAudioUrl(uri);
          setAudioPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleGenerate = async () => {
    if (!audioUrl) {
      toast({ title: 'Please upload an audio file.', variant: 'destructive' });
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

    setIsSubmitting(true);
    setGeneratedVideo(null);
    setLogs([]);
    setRequestId(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    toast({ title: "Submitting video generation job...", description: "This can take a few minutes."});

    const result = await submitAudioToVideoRequestAction({
      avatarId,
      audioUrl,
      apiKey,
    });
    
    setIsSubmitting(false);

    if (result.success && result.data?.requestId) {
      setRequestId(result.data.requestId);
      setIsPolling(true);
      toast({ title: 'Job submitted!', description: 'Now generating video and fetching logs...' });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : 'An unknown error occurred.';
      toast({
        title: 'Error submitting job',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isGenerating = isSubmitting || isPolling;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Input</CardTitle>
          <CardDescription>Select a Veed avatar and provide an audio file to generate a video.</CardDescription>
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
            <Label htmlFor="avatar-select">Avatar</Label>
            <Select value={avatarId} onValueChange={setAvatarId} disabled={isGenerating || !apiKey}>
                <SelectTrigger id="avatar-select">
                    <SelectValue placeholder="Select an avatar..." />
                </SelectTrigger>
                <SelectContent>
                    {veedAvatars.map(id => (
                        <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          
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
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !audioUrl} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : isPolling ? 'Generating...' : 'Generate Video'}
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Output</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 rounded-b-lg p-2">
          {isGenerating ? (
            <div className="text-center text-muted-foreground">
                <PersonStanding className="mx-auto h-12 w-12 animate-pulse" />
                <p className="mt-2 font-semibold">{isPolling ? 'Generating Video...' : 'Submitting Job...'}</p>
                <p className="text-sm">This may take a few minutes. Logs will appear below.</p>
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
              <PersonStanding className="mx-auto h-12 w-12" />
              <p>Your generated video will appear here.</p>
            </div>
          )}
        </CardContent>
        {(isPolling || logs.length > 0) && (
          <>
            <CardHeader className="border-t">
              <CardTitle className="font-headline text-xl">Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted">
                {logs.length > 0 ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {logs.join('\n')}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground">Waiting for logs...</p>
                )}
              </ScrollArea>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
