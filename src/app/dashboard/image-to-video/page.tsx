import { DashboardHeader } from "@/components/dashboard-header";
import { ImageToVideoForm } from "@/components/features/image-to-video-form";

export default function ImageToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Image to Video (Kling)"
        description="Animate an image to create a short video clip using Fal.ai Kling."
      />
      <main className="flex-1 p-6">
        <ImageToVideoForm />
      </main>
    </>
  );
}
