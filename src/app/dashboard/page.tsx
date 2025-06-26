import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, BookHeart, MessageSquare, Image, Mic } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";

const featureCards = [
  {
    title: "Setup Your Account",
    description: "Add your API keys to unlock the full potential of the platform.",
    href: "/dashboard/account",
    icon: <User className="h-6 w-6" />,
  },
  {
    title: "Integrate Memories",
    description: "Provide stories and traits to shape the AI's personality.",
    href: "/dashboard/memory-integration",
    icon: <BookHeart className="h-6 w-6" />,
  },
  {
    title: "Clone a Voice",
    description: "Upload an audio sample to create a realistic voice clone.",
    href: "/dashboard/voice-cloning",
    icon: <Mic className="h-6 w-6" />,
  },
  {
    title: "Generate an Avatar",
    description: "Create a visual representation from a photo.",
    href: "/dashboard/avatar-generation",
    icon: <Image className="h-6 w-6" />,
  },
  {
    title: "Start a Conversation",
    description: "Engage in a meaningful chat with the AI memorial.",
    href: "/dashboard/chat",
    icon: <MessageSquare className="h-6 w-6" />,
  },
];

export default function DashboardOverview() {
  return (
    <>
      <DashboardHeader
        title="Welcome Back"
        description="Your journey of remembrance starts here."
      />
      <main className="flex-1 p-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to create your first interactive memorial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <div>
                    <h3 className="font-semibold">Configure API Keys</h3>
                    <p className="text-sm text-muted-foreground">Go to the <Link href="/dashboard/account" className="text-primary underline">Account</Link> page to enter your keys from services like ElevenLabs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <div>
                    <h3 className="font-semibold">Add Memories</h3>
                    <p className="text-sm text-muted-foreground">Visit the <Link href="/dashboard/memory-integration" className="text-primary underline">Memories</Link> page to provide the stories that will form the AI's knowledge.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <div>
                    <h3 className="font-semibold">Create Voice & Avatar</h3>
                    <p className="text-sm text-muted-foreground">Use the generation tools to create the voice and visual identity of your loved one.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
                  <div>
                    <h3 className="font-semibold">Begin Chatting</h3>
                    <p className="text-sm text-muted-foreground">Open the <Link href="/dashboard/chat" className="text-primary underline">Chat</Link> page to start your conversation.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <Card key={card.title} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-md bg-primary/10 text-primary">
                    {card.icon}
                  </div>
                  <div>
                    <CardTitle className="font-headline text-xl">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={card.href}>
                      Go to {card.title} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
