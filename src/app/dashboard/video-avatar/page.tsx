import { DashboardHeader } from "@/components/dashboard-header";
import { VideoAvatarForm } from "@/components/features/video-avatar-form";

export default function VideoAvatarPage() {
  return (
    <>
      <DashboardHeader
        title="Video Avatar"
        description="Generate a talking avatar video from an image and an audio file."
      />
      <main className="flex-1 p-6">
        <VideoAvatarForm />
      </main>
    </>
  );
}
