import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function TextToVideoGooglePage() {
  return (
    <>
      <DashboardHeader
        title="Text to Video (Google)"
        description="Generate a video using Google's video generation service."
      />
      <main className="flex-1">
        <PlaceholderPage 
          title="Text to Video (Google)"
          description="This is where you will simulate a call to a Google video generation service."
        />
      </main>
    </>
  );
}
