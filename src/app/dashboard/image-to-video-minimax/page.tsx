import { DashboardHeader } from "@/components/dashboard-header";
import { ImageToVideoMinimaxForm } from "@/components/features/image-to-video-minimax-form";

export default function ImageToVideoMinimaxPage() {
  return (
    <>
      <DashboardHeader
        title="Image to Video (Minimax)"
        description="Animate an image to create a short video clip using Fal.ai Minimax."
      />
      <main className="flex-1 p-6">
        <ImageToVideoMinimaxForm />
      </main>
    </>
  );
}
