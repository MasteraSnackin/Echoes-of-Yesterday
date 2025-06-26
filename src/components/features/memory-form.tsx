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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMemoryStore } from "@/lib/store/memory";
import useHydratedStore from "@/hooks/use-hydrated-store";
import { saveMemoriesAction } from "@/app/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  memories: z.string().min(10, {
    message: "Please enter at least 10 characters to save.",
  }),
});

export function MemoryForm() {
  const { toast } = useToast();
  const memories = useHydratedStore(useMemoryStore, (state) => state.memories);
  const setMemoriesInStore = useMemoryStore((state) => state.setMemories);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memories: "",
    },
  });

  useEffect(() => {
    if (memories) {
      form.setValue("memories", memories);
    }
  }, [memories, form]);
  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    const result = await saveMemoriesAction({ memories: values.memories });
    setIsSaving(false);

    if (result.success) {
      setMemoriesInStore(values.memories);
      toast({
        title: "Memories Saved",
        description: "The AI will now use these memories in conversation.",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not save memories. " + (result.error as any)?.memories?.[0] || result.error,
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Memory Integration</CardTitle>
            <CardDescription>
              Provide the stories, personality traits, and cherished memories of your loved one. The more detail you provide, the more authentic the conversation will be. This text is saved automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="memories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memories & Personality</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about them... their favorite stories, their unique quirks, how they spoke, what they loved..."
                      className="min-h-[300px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Memories
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
