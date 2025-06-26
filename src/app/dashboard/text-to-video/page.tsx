import { DashboardHeader } from "@/components/dashboard-header";
import { ImageGenerator } from "@/components/features/image-generator";

export default function TextToImagePage() {
  return (
    <>
      <DashboardHeader
        title="Image Studio"
        description="Generate images from text, inspired by memories."
      />
      <main className="flex-1 p-6">
        <ImageGenerator />
      </main>
    </>
  );
}
