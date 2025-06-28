import { DashboardHeader } from "@/components/dashboard-header";
import { ImageToVideoKlingForm } from "@/components/features/image-to-video-kling-form";

export default function ImageToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Image to Video"
        description="Generate a video from an image and prompt using the Kling Video API."
      />
      <main className="flex-1 p-6">
        <ImageToVideoKlingForm />
      </main>
    </>
  );
}