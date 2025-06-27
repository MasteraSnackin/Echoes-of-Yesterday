import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function AvatarToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Avatar to Video"
        description="Animate your active avatar to create a short video clip."
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
