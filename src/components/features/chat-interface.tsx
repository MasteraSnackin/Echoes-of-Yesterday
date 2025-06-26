"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Mic, Volume2, User as UserIcon, Loader2, StopCircle } from 'lucide-react';

import { useMemoryStore } from '@/lib/store/memory';
import { useAvatarStore } from '@/lib/store/avatar';
import { useVoiceStore } from '@/lib/store/voice';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { chatAction, speechToTextAction } from '@/app/actions';
import { useApiKeyStore } from '@/lib/store/api-keys';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUri?: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const memories = useHydratedStore(useMemoryStore, state => state.memories);
  const avatarUri = useHydratedStore(useAvatarStore, state => state.selectedAvatarUri);
  const voiceId = useHydratedStore(useVoiceStore, state => state.clonedVoiceId);
  const elevenLabsApiKey = useHydratedStore(useApiKeyStore, state => state.elevenLabsApiKey);

  useEffect(() => {
    // Check for microphone permission on component mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasMicPermission(true);
        // We need to stop the track immediately, we only wanted to ask for permission
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        setHasMicPermission(false);
        console.error("Mic permission denied:", err);
      });
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const result = await chatAction({
      userInput: input,
      integratedMemories: memories || '',
      userAvatarUri: avatarUri || undefined,
      clonedVoiceId: voiceId || undefined,
      elevenLabsApiKey: elevenLabsApiKey || undefined,
    });

    setIsLoading(false);

    if (result.success && result.data) {
      const aiMessage: Message = {
        role: 'assistant',
        content: result.data.aiResponse,
        audioUri: result.data.audioResponseUri,
      };
      setMessages(prev => [...prev, aiMessage]);
    } else {
      toast({
        title: 'Error getting response',
        description: result.error,
        variant: 'destructive'
      });
      setMessages(prev => prev.slice(0, -1)); // Remove the user message if API fails
    }
  };
  
  const playAudio = (audioUri: string) => {
    const audio = new Audio(audioUri);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };

  const startRecording = async () => {
    if (!hasMicPermission) {
        toast({
            title: "Microphone permission required",
            description: "Please allow microphone access in your browser settings.",
            variant: "destructive"
        });
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                setIsTranscribing(true);
                const result = await speechToTextAction({ audioDataUri: base64Audio });
                setIsTranscribing(false);

                if (result.success && result.data?.transcript) {
                    setInput(prev => prev ? `${prev} ${result.data.transcript}` : result.data.transcript);
                } else {
                    toast({
                        title: 'Transcription Failed',
                        description: result.error as string || "Could not transcribe audio.",
                        variant: 'destructive',
                    });
                }
            };
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (error) {
        console.error("Error starting recording:", error);
        toast({
            title: "Could not start recording",
            description: "Please ensure your microphone is connected and permissions are allowed.",
            variant: "destructive"
        });
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };
  
  const handleMicClick = () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
  };

  return (
    <Card className="h-full w-full flex flex-col">
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <Avatar>
                    <AvatarImage src={avatarUri || undefined} alt="AI Avatar" data-ai-hint="portrait person" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-3 max-w-[75%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.content}</p>
                  {message.role === 'assistant' && message.audioUri && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 mt-2" onClick={() => playAudio(message.audioUri!)}>
                      <Volume2 className="h-4 w-4" />
                      <span className="sr-only">Play audio</span>
                    </Button>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar>
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={avatarUri || undefined} alt="AI Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="relative">
            <Textarea
              placeholder={isTranscribing ? "Transcribing..." : (isRecording ? "Recording... Click the mic to stop." : "Type your message here or click the mic to speak...")}
              className="pr-24 min-h-[50px] resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              readOnly={isTranscribing || isRecording}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
               <Button variant="ghost" size="icon" onClick={handleMicClick} disabled={isLoading || isTranscribing} className={cn(isRecording && 'text-red-500 hover:text-red-600')}>
                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span className="sr-only">{isRecording ? "Stop recording" : "Use microphone"}</span>
              </Button>
              <Button onClick={handleSend} disabled={isLoading || isTranscribing || !input.trim()} size="icon">
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
