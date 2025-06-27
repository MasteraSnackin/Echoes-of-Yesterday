import { DashboardHeader } from "@/components/dashboard-header";
import { TextToVideoForm } from "@/components/features/text-to-video-form";

export default function TextToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Text to Video"
        description="Generate a video from a text prompt using Fal.ai Veo3."
      />
      <main className="flex-1 p-6">
        <TextToVideoForm />
      </main>
    </>
  );
}
