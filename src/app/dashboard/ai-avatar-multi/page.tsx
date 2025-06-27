import { DashboardHeader } from "@/components/dashboard-header";
import { AiAvatarMultiForm } from "@/components/features/ai-avatar-multi-form";

export default function AiAvatarMultiPage() {
  return (
    <>
      <DashboardHeader
        title="AI Avatar (Multi-Person)"
        description="Generate a video of up to two people speaking from a single image and audio files."
      />
      <main className="flex-1 p-6">
        <AiAvatarMultiForm />
      </main>
    </>
  );
}
