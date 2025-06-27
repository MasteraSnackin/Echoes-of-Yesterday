import { DashboardHeader } from "@/components/dashboard-header";
import { ImageGenerator } from "@/components/features/image-generator";

export default function ImageStudioPage() {
  return (
    <>
      <DashboardHeader
        title="Image Studio"
        description="Generate a new image from a text prompt, optionally using your avatar as a base."
      />
      <main className="flex-1 p-6">
        <ImageGenerator />
      </main>
    </>
  );
}
