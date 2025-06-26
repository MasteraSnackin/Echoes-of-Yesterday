import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function AvatarToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Avatar to Video"
        description="Animate your active avatar based on a text prompt."
      />
      <main className="flex-1">
        <PlaceholderPage 
          title="Avatar to Video"
          description="This is where you will animate your active avatar using a text prompt and the Fal.ai Kling API."
        />
      </main>
    </>
  );
}
