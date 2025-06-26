import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
            <Wand2 className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This feature is currently under development. Please check back later.</p>
        </CardContent>
      </Card>
    </div>
  );
}
