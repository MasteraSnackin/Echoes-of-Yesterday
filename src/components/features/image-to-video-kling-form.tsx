"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitImageToVideoKlingRequestAction, getImageToVideoKlingRequestStatusAction } from '@/app/actions';
import { Loader2, Sparkles, Video, AlertTriangle, ChevronDown } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '../ui/scroll-area';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ImageToVideoKlingForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('As the sun dips below the horizon, painting the sky in fiery hues of orange and purple, powerful waves relentlessly crash against jagged, dark rocks');
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [cfgScale, setCfgScale] = useState<number>(0.5);
  const [negativePrompt, setNegativePrompt] = useState<string>('blur, distort, and low quality');

  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.falAiApiKey);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (requestId && isPolling && apiKey) {
      pollingIntervalRef.current = setInterval(async () => {
        const result = await getImageToVideoKlingRequestStatusAction({ requestId, apiKey });

        if (result.success && result.data) {
          const { status, logs: newLogs, videoUrl, error } = result.data;
          
          if (newLogs) setLogs(newLogs);

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
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [requestId, isPolling, apiKey, toast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setImageUrl(uri);
      }
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      toast({ title: 'Please upload an image first.', variant: 'destructive' });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt.', variant: 'destructive' });
      return;
    }
    if (!apiKey) {
      toast({ title: 'Fal.ai API Key Missing', description: <p>Please add your Fal.ai API key on the <Link href="/dashboard/account" className="underline font-bold">Account</Link> page.</p>, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setGeneratedVideo(null);
    setLogs([]);
    setRequestId(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    toast({ title: "Submitting video generation job...", description: "This can take several minutes."});

    const result = await submitImageToVideoKlingRequestAction({
      imageUrl, prompt, apiKey, duration, cfg_scale: cfgScale, negative_prompt: negativePrompt,
    });
    
    setIsSubmitting(false);

    if (result.success && result.data?.requestId) {
      setRequestId(result.data.requestId);
      setIsPolling(true);
      toast({ title: 'Job submitted!', description: 'Now generating video...' });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : 'An unknown error occurred.';
      toast({ title: 'Error submitting job', description: errorMessage, variant: 'destructive' });
    }
  };

  const isGenerating = isSubmitting || isPolling;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Image-to-Video with Kling</CardTitle>
          <CardDescription>Generate a video from an image and prompt using the Kling Video API. Videos can take several minutes to generate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!apiKey && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fal.ai API Key Not Found</AlertTitle>
                <AlertDescription>Please go to the <Link href="/dashboard/account" className="font-bold underline">Account</Link> page to add your API key.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="image-upload">Image</Label>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={!apiKey || isGenerating} />
          </div>
          {imageUrl && (
            <div className="aspect-video relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
                <Image src={imageUrl} alt="Uploaded image" layout="fill" objectFit="contain" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the motion and scene you want to see..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating || !apiKey}
            />
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 flex items-center gap-1 text-sm">
                    Advanced Settings
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={(value: "5" | "10") => setDuration(value)} disabled={isGenerating || !apiKey}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="10">10 seconds</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label>CFG Scale: {cfgScale}</Label>
                    <Slider
                        value={[cfgScale]}
                        onValueChange={(value) => setCfgScale(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        disabled={isGenerating || !apiKey}
                    />
                    <p className="text-xs text-muted-foreground">How closely the model follows your prompt</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="negative-prompt">Negative Prompt</Label>
                    <Textarea
                        id="negative-prompt"
                        placeholder="Things you don't want to see..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[80px]"
                        disabled={isGenerating || !apiKey}
                    />
                </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !imageUrl || !prompt.trim()} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : isPolling ? 'Generating...' : 'Generate Video'}
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Result</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 rounded-lg p-2">
          {isGenerating ? (
            <div className="text-center text-muted-foreground">
                <Video className="mx-auto h-12 w-12 animate-pulse" />
                <p className="mt-2 font-semibold">{isPolling ? 'Generating Video...' : 'Submitting Job...'}</p>
                <p className="text-sm">This may take several minutes. Logs will appear below.</p>
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
        {(isPolling || logs.length > 0) && (
          <>
            <CardHeader className="border-t">
              <CardTitle className="font-headline text-xl">Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted">
                {logs.length > 0 ? (
                  <pre className="text-xs whitespace-pre-wrap">{logs.join('\n')}</pre>
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