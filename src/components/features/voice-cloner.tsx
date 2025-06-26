"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useApiKeyStore } from '@/lib/store/api-keys';
import { useVoiceStore } from '@/lib/store/voice';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { cloneVoiceAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mic, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function VoiceCloner() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.elevenLabsApiKey);
  const { setClonedVoiceId } = useVoiceStore();
  const hydratedVoiceId = useHydratedStore(useVoiceStore, (state) => state.clonedVoiceId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload an audio file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setAudioFile(file);
    }
  };

  const handleClone = async () => {
    if (!audioFile) {
      toast({ title: "Please select an audio file.", variant: "destructive" });
      return;
    }
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your ElevenLabs API key on the Account page.",
        variant: "destructive",
      });
      return;
    }

    setIsCloning(true);
    const audioDataUri = await fileToDataUri(audioFile);

    const result = await cloneVoiceAction({
      audioDataUri,
      fileName: audioFile.name,
      apiKey,
    });
    setIsCloning(false);

    if (result.success && result.data?.voiceId) {
      setClonedVoiceId(result.data.voiceId);
      toast({ title: "Voice Cloned Successfully", description: `New voice ID: ${result.data.voiceId}` });
    } else {
      toast({
        title: "Cloning Failed",
        description: typeof result.error === 'string' ? result.error : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create a Voice Clone</CardTitle>
        <CardDescription>
          Upload a clear audio sample (MP3, WAV) of at least one minute. The voice will be used to generate audio in the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!apiKey && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>ElevenLabs API Key Not Found</AlertTitle>
                <AlertDescription>
                Please go to the <Link href="/dashboard/account" className="font-bold underline">Account</Link> page to add your API key.
                </AlertDescription>
            </Alert>
        )}

        {hydratedVoiceId && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Active Voice Clone</AlertTitle>
            <AlertDescription>
              An active voice clone is ready to be used in the chat.
              <p className="font-mono text-xs bg-muted p-2 rounded-md mt-2 break-all">ID: {hydratedVoiceId}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="audio-upload">Audio File</Label>
          <Input id="audio-upload" type="file" accept="audio/mpeg,audio/wav" onChange={handleFileChange} disabled={!apiKey || isCloning}/>
          {audioFile && <p className="text-sm text-muted-foreground">Selected: {audioFile.name}</p>}
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleClone} disabled={isCloning || !audioFile || !apiKey}>
          {isCloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
          {hydratedVoiceId ? "Create New Voice Clone" : "Create Voice Clone"}
        </Button>
      </CardFooter>
    </Card>
  );
}
