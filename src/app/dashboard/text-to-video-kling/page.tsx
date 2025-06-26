import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function TextToVideoKlingPage() {
  return (
    <>
      <DashboardHeader
        title="Text to Video (Kling)"
        description="Generate a short video from a text prompt using the Fal.ai Kling API."
      />
      <main className="flex-1">
        <PlaceholderPage 
          title="Text to Video (Kling)"
          description="This is where you will generate short videos from text prompts via the Fal.ai Kling API."
        />
      </main>
    </>
  );
}
