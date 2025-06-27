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
          title="Feature Removed"
          description="This feature has been removed."
        />
      </main>
    </>
  );
}
