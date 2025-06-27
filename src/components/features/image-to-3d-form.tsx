"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitImageTo3dRequestAction, getImageTo3dRequestStatusAction } from '@/app/actions';
import { Loader2, Sparkles, AlertTriangle, ChevronDown, Download, Box } from 'lucide-react';
import useHydratedStore from '@/hooks/use-hydrated-store';
import { useApiKeyStore } from '@/lib/store/api-keys';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

const styles = ["person:person2cartoon", "object:clay", "object:steampunk", "animal:venom", "object:barbie", "object:christmas", "gold", "ancient_bronze"];
const textures = ["no", "standard", "HD"];
const textureAlignments = ["original_image", "geometry"];
const orientations = ["default", "align_image"];

export function ImageTo3dForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [faceLimit, setFaceLimit] = useState<number | undefined>();
  const [style, setStyle] = useState<string | undefined>();
  const [pbr, setPbr] = useState(false);
  const [texture, setTexture] = useState("standard");
  const [textureAlignment, setTextureAlignment] = useState("original_image");
  const [autoSize, setAutoSize] = useState(false);
  const [seed, setSeed] = useState<number | undefined>();
  const [quad, setQuad] = useState(false);
  const [orientation, setOrientation] = useState("default");
  const [textureSeed, setTextureSeed] = useState<number | undefined>();

  const [generatedResult, setGeneratedResult] = useState<{
    renderedImageUrl?: string | null;
    modelMeshUrl?: string | null;
    pbrModelUrl?: string | null;
  } | null>(null);
  
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
        const result = await getImageTo3dRequestStatusAction({ requestId, apiKey });

        if (result.success && result.data) {
          const { status, logs: newLogs, error, ...rest } = result.data;
          
          if (newLogs) setLogs(newLogs);

          if (status === 'COMPLETED') {
            setIsPolling(false);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setGeneratedResult(rest);
            toast({ title: '3D model generated successfully!' });
          } else if (status === 'FAILED') {
            setIsPolling(false);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            toast({ title: 'Error generating model', description: error || 'An unknown error occurred.', variant: 'destructive' });
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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const uri = await fileToDataUri(file);
          setImageUrl(uri);
      }
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      toast({ title: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    if (!apiKey) {
      toast({ title: 'Fal.ai API Key Missing', description: <p>Please add your Fal.ai API key on the <Link href="/dashboard/account" className="underline font-bold">Account</Link> page.</p>, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setGeneratedResult(null);
    setLogs([]);
    setRequestId(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    toast({ title: "Submitting 3D model generation job...", description: "This can take a few minutes."});

    const result = await submitImageTo3dRequestAction({
      imageUrl, apiKey, face_limit: faceLimit, style, pbr, texture, texture_alignment: textureAlignment, auto_size: autoSize, seed, quad, orientation, texture_seed: textureSeed,
    });
    
    setIsSubmitting(false);

    if (result.success && result.data?.requestId) {
      setRequestId(result.data.requestId);
      setIsPolling(true);
      toast({ title: 'Job submitted!', description: 'Now generating 3D model...' });
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
          <CardTitle className="font-headline text-2xl">Input</CardTitle>
          <CardDescription>Upload an image to generate a 3D model. Adjust settings for more control.</CardDescription>
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
            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageFileChange} disabled={!apiKey || isGenerating} />
          </div>
          {imageUrl && (
            <div className="aspect-square relative w-48 mx-auto rounded-lg overflow-hidden border">
                <Image src={imageUrl} alt="Uploaded image" layout="fill" objectFit="contain" />
            </div>
          )}
          
          <Collapsible>
            <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 flex items-center gap-1">
                    <ChevronDown className="h-4 w-4" />
                    Advanced settings
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={style} onValueChange={setStyle} disabled={isGenerating || !apiKey}>
                        <SelectTrigger><SelectValue placeholder="Select style..." /></SelectTrigger>
                        <SelectContent>{styles.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Texture</Label>
                    <Select value={texture} onValueChange={setTexture} disabled={isGenerating || !apiKey}>
                        <SelectTrigger><SelectValue placeholder="Select texture..." /></SelectTrigger>
                        <SelectContent>{textures.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center space-x-2"><Switch id="pbr" checked={pbr} onCheckedChange={setPbr} disabled={isGenerating || !apiKey} /><Label htmlFor="pbr">PBR</Label></div>
                 <div className="flex items-center space-x-2"><Switch id="auto_size" checked={autoSize} onCheckedChange={setAutoSize} disabled={isGenerating || !apiKey} /><Label htmlFor="auto_size">Auto Size</Label></div>
                 <div className="flex items-center space-x-2"><Switch id="quad" checked={quad} onCheckedChange={setQuad} disabled={isGenerating || !apiKey} /><Label htmlFor="quad">Quad Mesh</Label></div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !apiKey || !imageUrl} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : isPolling ? 'Generating...' : 'Run'}
          </Button>
        </CardFooter>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Output</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center bg-muted/50 rounded-lg p-2 gap-4">
          {isGenerating ? (
            <div className="text-center text-muted-foreground">
                <Box className="mx-auto h-12 w-12 animate-pulse" />
                <p className="mt-2 font-semibold">{isPolling ? 'Generating Model...' : 'Submitting Job...'}</p>
                <p className="text-sm">This may take a few minutes. Logs will appear below.</p>
            </div>
          ) : generatedResult?.renderedImageUrl ? (
            <>
                <Image src={generatedResult.renderedImageUrl} alt="Rendered 3D model" width={256} height={256} className="rounded-lg object-cover aspect-square border" />
                <div className="flex gap-4">
                    {generatedResult.modelMeshUrl && <Button asChild><a href={generatedResult.modelMeshUrl} target="_blank" download><Download className="mr-2"/>GLB Model</a></Button>}
                    {generatedResult.pbrModelUrl && <Button asChild variant="secondary"><a href={generatedResult.pbrModelUrl} target="_blank" download><Download className="mr-2"/>PBR Model</a></Button>}
                </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <Box className="mx-auto h-12 w-12" />
              <p>Your generated 3D model will appear here.</p>
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
