import { DashboardHeader } from "@/components/dashboard-header";
import { ImageToVideoPixverseForm } from "@/components/features/image-to-video-pixverse-form";

export default function ImageToVideoPixversePage() {
  return (
    <>
      <DashboardHeader
        title="Image to Video (Pixverse)"
        description="Animate an image to create a short video clip using Fal.ai Pixverse."
      />
      <main className="flex-1 p-6">
        <ImageToVideoPixverseForm />
      </main>
    </>
  );
}
