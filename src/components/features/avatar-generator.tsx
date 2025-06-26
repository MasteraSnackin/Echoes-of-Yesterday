"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateImageAction } from "@/app/actions";
import { Loader2, Sparkles, UploadCloud, CheckCircle2 } from "lucide-react";
import { useAvatarStore } from "@/lib/store/avatar";
import useHydratedStore from "@/hooks/use-hydrated-store";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const examplePrompts = [
    "A professional, compassionate portrait",
    "A warm, friendly smile, in a watercolor style",
    "A black and white sketch with a thoughtful expression",
    "Pop art style with vibrant, bold colors",
    "A soft, dreamy look with a fantasy background",
];

export function AvatarGenerator() {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImageUri, setBaseImageUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(examplePrompts[0]);
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const selectedAvatarUri = useHydratedStore(useAvatarStore, (state) => state.selectedAvatarUri);
  const setSelectedAvatarUri = useAvatarStore((state) => state.setSelectedAvatarUri);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseImage(file);
      const uri = await fileToDataUri(file);
      setBaseImageUri(uri);
    }
  };

  const handleGenerate = async () => {
    if (!baseImageUri) {
      toast({ title: "Please upload an image first.", variant: "destructive" });
      return;
    }
    if (!prompt) {
      toast({ title: "Please enter a prompt.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    const result = await generateImageAction({ prompt, avatarDataUri: baseImageUri });
    setIsGenerating(false);

    if (result.success && result.data?.imageDataUri) {
      setGeneratedAvatars(prev => [...prev, result.data.imageDataUri]);
      toast({ title: "Avatar generated successfully!" });
    } else {
      toast({ title: "Error generating avatar", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">1. Upload a Photo</CardTitle>
          <CardDescription>Upload a clear photo of your loved one. This will be used as the base for the AI avatars.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo-upload">Photo</Label>
            <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {baseImageUri && (
            <div className="aspect-square relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
              <Image src={baseImageUri} alt="Uploaded photo" layout="fill" objectFit="cover" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">For best results, use a high-resolution, front-facing photo.</p>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">2. Generate Avatars</CardTitle>
          <CardDescription>Use the uploaded photo and a prompt to generate variations. Select your favorite to use in the chat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Style Prompt</Label>
            <Input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Examples</Label>
            <div className="flex flex-wrap gap-2">
                {examplePrompts.map((p) => (
                    <Button key={p} variant="outline" size="sm" onClick={() => setPrompt(p)} className="h-auto text-wrap">
                        {p}
                    </Button>
                ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !baseImageUri} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate New Avatar
          </Button>
          
          {generatedAvatars.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold">Generated Avatars</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedAvatars.map((avatar, index) => (
                  <div key={index} className="relative group">
                    <Image src={avatar} alt={`Generated Avatar ${index + 1}`} width={200} height={200} className="rounded-lg object-cover aspect-square" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {selectedAvatarUri === avatar ? (
                        <div className="flex flex-col items-center gap-2 text-white">
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setSelectedAvatarUri(avatar)}>Set Active</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
