"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateImageAction } from '@/app/actions';
import { Loader2, Sparkles, Image as ImageIcon, User } from 'lucide-react';
import { useAvatarStore } from '@/lib/store/avatar';
import useHydratedStore from '@/hooks/use-hydrated-store';
import Link from 'next/link';

const formSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

type ImageGeneratorFormValues = z.infer<typeof formSchema>;

export function ImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const selectedAvatarUri = useHydratedStore(useAvatarStore, (state) => state.selectedAvatarUri);

  const form = useForm<ImageGeneratorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(data: ImageGeneratorFormValues) {
    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);
    toast({ title: 'Image generation has started...' });

    const result = await generateImageAction({
      prompt: data.prompt,
      avatarDataUri: selectedAvatarUri ? selectedAvatarUri : undefined,
    });
    
    setIsGenerating(false);

    if (result.success && result.data?.imageDataUris && result.data.imageDataUris.length > 0) {
      setGeneratedImage(result.data.imageDataUris[0]);
      toast({ title: 'Image generated successfully!' });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ title: 'Error generating image', description: errorMessage, variant: 'destructive' });
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
               <CardTitle className="font-headline text-2xl">Generation Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {selectedAvatarUri ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Using Active Avatar</CardTitle>
                            <CardDescription>
                                Your active avatar will be used as a base for the image generation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Image src={selectedAvatarUri} alt="Active Avatar" width={100} height={100} className="rounded-md border" />
                        </CardContent>
                    </Card>
                ) : (
                    <Alert>
                        <User className="h-4 w-4" />
                        <AlertTitle>Generating from Text Only</AlertTitle>
                        <AlertDescription>
                            No active avatar found. To use an image as a base, first{' '}
                            <Link href="/dashboard/avatar-generation" className="font-bold underline">
                            generate an avatar
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                )}

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A serene painting of them sitting by a lake at sunset"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isGenerating ? 'Generating Image...' : 'Generate Image'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Result</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 rounded-b-lg p-2">
          {isGenerating ? (
            <div className="text-center text-muted-foreground animate-pulse">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p className="mt-2 font-semibold">Generating image...</p>
            </div>
          ) : error ? (
             <Card className="w-full bg-destructive/10 border-destructive text-destructive">
                <CardHeader>
                    <CardTitle>Generation Failed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
            </Card>
          ) : generatedImage ? (
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
