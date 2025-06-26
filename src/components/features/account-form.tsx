"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useApiKeyStore } from "@/lib/store/api-keys";
import useHydratedStore from "@/hooks/use-hydrated-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

const formSchema = z.object({
  elevenLabsApiKey: z.string().optional(),
  photoroomApiKey: z.string().optional(),
  sieveApiKey: z.string().optional(),
  falAiApiKey: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof formSchema>;

export function AccountForm() {
  const { toast } = useToast();
  const apiKeys = useHydratedStore(useApiKeyStore, (state) => ({
    elevenLabsApiKey: state.elevenLabsApiKey,
    photoroomApiKey: state.photoroomApiKey,
    sieveApiKey: state.sieveApiKey,
    falAiApiKey: state.falAiApiKey,
  }));
  const setApiKey = useApiKeyStore((state) => state.setApiKey);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      elevenLabsApiKey: "",
      photoroomApiKey: "",
      sieveApiKey: "",
      falAiApiKey: "",
    },
  });

  useEffect(() => {
    if (apiKeys) {
      form.reset(apiKeys);
    }
  }, [apiKeys, form]);


  function onSubmit(data: ApiKeyFormValues) {
    Object.entries(data).forEach(([key, value]) => {
      setApiKey(key as keyof ApiKeyFormValues, value || "");
    });

    toast({
      title: "Settings Saved",
      description: "Your API keys have been updated successfully.",
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">API Keys</CardTitle>
            <CardDescription>
              Enter your API keys from third-party services. These are stored securely in your browser and are required for the app's features to function.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="elevenLabsApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ElevenLabs API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="sk_..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for voice cloning.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="photoroomApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photoroom API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your Photoroom Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for background removal from avatars.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="sieveApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sieve API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your Sieve Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for asking questions about media.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="falAiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fal.ai API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your Fal.ai Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for video generation features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Settings</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
