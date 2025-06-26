"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateImageAction } from '@/app/actions';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAvatarStore } from '@/lib/store/avatar';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAvatar, setUseAvatar] = useState(true);
  const { toast } = useToast();

  const selectedAvatarUri = useHydratedStore(useAvatarStore, (state) => state.selectedAvatarUri);

  const handleGenerate = async () => {
    if (!prompt) {
      toast({ title: 'Please enter a prompt.', variant: 'destructive' });
      return;
    }

    if (useAvatar && !selectedAvatarUri) {
      toast({
        title: 'No active avatar selected.',
        description: 'Please generate an avatar first or disable the "Use Active Avatar" switch.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    const result = await generateImageAction({
      prompt,
      avatarDataUri: useAvatar ? selectedAvatarUri! : undefined,
    });
    setIsGenerating(false);

    if (result.success && result.data?.imageDataUri) {
      setGeneratedImage(result.data.imageDataUri);
      toast({ title: 'Image generated successfully!' });
    } else {
      toast({ title: 'Error generating image', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Image Studio</CardTitle>
          <CardDescription>
            Generate a new image from a text prompt. You can optionally use your active avatar as a base for the generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A serene painting of them sitting by a lake at sunset"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-avatar"
              checked={useAvatar}
              onCheckedChange={setUseAvatar}
              disabled={!selectedAvatarUri}
            />
            <Label htmlFor="use-avatar">Use Active Avatar as Base</Label>
          </div>
           {useAvatar && selectedAvatarUri && (
            <div>
              <Label>Active Avatar</Label>
              <Image src={selectedAvatarUri} alt="Active Avatar" width={80} height={80} className="rounded-md mt-1" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Image
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Result</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 rounded-b-lg">
          {generatedImage ? (
            <div className="relative w-full aspect-square max-w-md">
              <Image src={generatedImage} alt="Generated Image" layout="fill" objectFit="contain" />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
