import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function TextToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Text to Video"
        description="This feature is temporarily unavailable."
      />
      <main className="flex-1 p-6">
        <PlaceholderPage
          title="Feature Unavailable"
          description="The video generation service is currently down. We are working to resolve this issue."
        />
      </main>
    </>
  );
}
