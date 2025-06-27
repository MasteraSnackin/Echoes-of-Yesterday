import { DashboardHeader } from "@/components/dashboard-header";
import { TextToVideoKlingForm } from "@/components/features/text-to-video-kling-form";

export default function TextToVideoKlingPage() {
  return (
    <>
      <DashboardHeader
        title="Text to Video (Kling)"
        description="Generate a short video from a text prompt using the Fal.ai Kling API."
      />
      <main className="flex-1 p-6">
        <TextToVideoKlingForm />
      </main>
    </>
  );
}
