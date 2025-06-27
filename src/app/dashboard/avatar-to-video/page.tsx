import { DashboardHeader } from "@/components/dashboard-header";
import { AvatarToVideoForm } from "@/components/features/avatar-to-video-form";

export default function AvatarToVideoPage() {
  return (
    <>
      <DashboardHeader
        title="Avatar to Video"
        description="Animate your active avatar to create a short video clip."
      />
      <main className="flex-1 p-6">
        <AvatarToVideoForm />
      </main>
    </>
  );
}
