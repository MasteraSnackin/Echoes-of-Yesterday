import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AppLogo } from '@/components/icons';
import { MessageSquare, Clapperboard, Image, Mic } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'AI Conversations',
    description: 'Engage in meaningful conversations, powered by memories you provide.',
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: 'Voice Cloning',
    description: "Hear their voice again with our advanced voice cloning technology.",
  },
  {
    icon: <Image className="h-8 w-8 text-primary" />,
    title: 'Living Avatars',
    description: 'Create a dynamic, visual representation from a single photograph.',
  },
  {
    icon: <Clapperboard className="h-8 w-8 text-primary" />,
    title: 'Visual Stories',
    description: 'Generate images and videos that bring cherished memories to life.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <AppLogo className="h-6 w-6" />
          <span className="ml-2 font-semibold text-lg font-headline">Echoes of Yesterday</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Sign In
          </Link>
          <Button asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    Preserve Their Legacy, Forever.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Echoes of Yesterday offers a new way to remember. Create a living memory of your loved ones through AI-powered conversations, voice, and avatars.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/dashboard">Create a Memorial</Link>
                  </Button>
                </div>
              </div>
              <img
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="serene memory silhouette"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Our Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A New Form of Remembrance</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a suite of tools to build a comprehensive, interactive memorial that captures the essence of your loved one.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-2 xl:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 mb-4">{feature.icon}</div>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Echoes of Yesterday. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
