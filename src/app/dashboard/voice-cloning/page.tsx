import { DashboardHeader } from "@/components/dashboard-header";
import { VoiceCloner } from "@/components/features/voice-cloner";

export default function VoiceCloningPage() {
  return (
    <>
      <DashboardHeader
        title="Voice Cloning"
        description="Create a realistic voice clone from an audio sample."
      />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <VoiceCloner />
        </div>
      </main>
    </>
  );
}
