import { DashboardHeader } from "@/components/dashboard-header";
import { AudioToVideoForm } from "@/components/features/audio-to-video-form";

export default function AudioToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Audio to Video"
        description="Generate a talking avatar video from a pre-defined avatar and an audio file."
      />
      <main className="flex-1 p-6">
        <AudioToVideoForm />
      </main>
    </>
  );
}
