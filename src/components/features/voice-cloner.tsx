"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApiKeyStore } from '@/lib/store/api-keys';
import { useVoiceStore } from '@/lib/store/voice';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { cloneVoiceAction, textToSpeechAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mic, CheckCircle2, AlertTriangle, Volume2, Upload, Info, ExternalLink } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

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
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string>('');
  const [voiceDescription, setVoiceDescription] = useState<string>('');
  const [isCloning, setIsCloning] = useState(false);
  const { toast } = useToast();

  const apiKey = useHydratedStore(useApiKeyStore, (state) => state.elevenLabsApiKey);
  const { setClonedVoiceId } = useVoiceStore();
  const hydratedVoiceId = useHydratedStore(useVoiceStore, (state) => state.clonedVoiceId);

  const [testText, setTestText] = useState("Hello, this is a test of my new voice clone. I hope it sounds good!");
  const [isTesting, setIsTesting] = useState(false);
  const [testAudioUri, setTestAudioUri] = useState<string | null>(null);

  useEffect(() => {
    // Revoke the object URL to avoid memory leaks
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (25MB limit for ElevenLabs)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an audio file smaller than 25MB.",
          variant: "destructive"
        });
        return;
      }

      setAudioFile(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
      
      // Auto-generate voice name from filename if not set
      if (!voiceName) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        setVoiceName(nameWithoutExtension);
      }
    } else {
      setAudioFile(null);
      setAudioPreviewUrl(null);
    }
  };

  const handleClone = async () => {
    if (!audioFile) {
      toast({ title: "Please select an audio file.", variant: "destructive" });
      return;
    }
    if (!apiKey) {
      toast({
        title: "ElevenLabs API Key Missing",
        description: (
          <p>
            Please add your ElevenLabs API key on the{' '}
            <Link href="/dashboard/account" className="underline font-bold">
              Account
            </Link>{' '}
            page.
          </p>
        ),
        variant: "destructive",
      });
      return;
    }

    setIsCloning(true);
    
    try {
      const audioDataUri = await fileToDataUri(audioFile);

      const result = await cloneVoiceAction({
        audioDataUri,
        fileName: audioFile.name,
        apiKey,
        voiceName: voiceName || `Voice Clone ${new Date().toLocaleDateString()}`,
        description: voiceDescription || 'A voice cloned for Echoes of Yesterday',
      });

      if (result.success && result.data?.voiceId) {
        setClonedVoiceId(result.data.voiceId);
        toast({ 
          title: "Voice Cloned Successfully!", 
          description: result.data.message 
        });
        
        // Clear form
        setAudioFile(null);
        setAudioPreviewUrl(null);
        setVoiceName('');
        setVoiceDescription('');
      } else {
        toast({
          title: "Voice Cloning Failed",
          description: typeof result.error === 'string' ? result.error : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Voice Cloning Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleTestVoice = async () => {
    if (!hydratedVoiceId || !apiKey) {
      toast({ title: "Voice ID or API key is missing.", variant: "destructive" });
      return;
    }
    if (!testText.trim()) {
      toast({ title: "Please enter some text to test.", variant: "destructive" });
      return;
    }

    setIsTesting(true);
    setTestAudioUri(null);

    const result = await textToSpeechAction({
      text: testText,
      voiceId: hydratedVoiceId,
      apiKey,
    });
    setIsTesting(false);

    if (result.success && result.data?.audioDataUri) {
      setTestAudioUri(result.data.audioDataUri);
      toast({ title: "Test audio generated successfully." });
    } else {
      toast({
        title: "Failed to generate test audio",
        description: typeof result.error === 'string' ? result.error : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Mic className="h-6 w-6" />
            ElevenLabs Voice Cloning
          </CardTitle>
          <CardDescription>
            Upload a clear audio sample to create a realistic voice clone using ElevenLabs technology.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!apiKey && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ElevenLabs API Key Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>You need an ElevenLabs API key to use voice cloning.</p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/account">
                        Add API Key
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href="https://elevenlabs.io/app/voice-lab" target="_blank" rel="noopener noreferrer">
                        Get ElevenLabs Key <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Voice Cloning Requirements</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li><strong>Audio Quality:</strong> High-quality, clear speech (at least 1 minute recommended)</li>
                <li><strong>Content:</strong> Single speaker only - no music or background noise</li>
                <li><strong>Format:</strong> MP3, WAV, M4A, FLAC (max 25MB)</li>
                <li><strong>Language:</strong> English works best, but multilingual is supported</li>
                <li><strong>ElevenLabs Account:</strong> Requires active subscription for voice cloning</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="voice-name">Voice Name *</Label>
            <Input 
              id="voice-name"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Enter a name for this voice..."
              disabled={isCloning}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-description">Description (Optional)</Label>
            <Textarea 
              id="voice-description"
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="Describe this voice (e.g., 'Warm, friendly female voice')"
              className="min-h-[80px]"
              disabled={isCloning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-upload">Audio File *</Label>
            <Input 
              id="audio-upload" 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange} 
              disabled={!apiKey || isCloning}
              required
            />
            {audioFile && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>📁 {audioFile.name}</p>
                <p>📊 {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>🎵 {audioFile.type}</p>
              </div>
            )}
          </div>

          {audioPreviewUrl && (
            <div className="space-y-2">
              <Label>Preview Audio</Label>
              <audio controls src={audioPreviewUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleClone} 
            disabled={isCloning || !audioFile || !apiKey || !voiceName.trim()}
            className="w-full"
          >
            {isCloning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isCloning ? 'Cloning Voice with ElevenLabs...' : 'Clone Voice with ElevenLabs'}
          </Button>
        </CardFooter>
      </Card>

      {hydratedVoiceId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="font-headline text-xl">Active Voice Clone</CardTitle>
            </div>
            <CardDescription>
              Your voice has been successfully cloned with ElevenLabs. Test it below or use it in the chat interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">ElevenLabs Voice ID:</p>
              <p className="font-mono text-xs break-all text-muted-foreground">{hydratedVoiceId}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-text">Test Text</Label>
              <Textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to generate audio with your cloned voice..."
                className="min-h-[100px]"
                disabled={isTesting}
              />
            </div>

            <Button 
              onClick={handleTestVoice} 
              disabled={isTesting || !apiKey || !testText.trim()}
              className="w-full"
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="mr-2 h-4 w-4" />
              )}
              {isTesting ? 'Generating with ElevenLabs...' : 'Generate Test Audio'}
            </Button>

            {testAudioUri && (
              <div className="space-y-2">
                <Label>Generated Audio (ElevenLabs)</Label>
                <audio controls src={testAudioUri} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}