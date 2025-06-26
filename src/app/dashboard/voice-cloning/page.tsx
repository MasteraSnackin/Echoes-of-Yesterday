import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function VoiceCloningPage() {
  return (
    <>
      <DashboardHeader
        title="Voice Cloning"
        description="Create a realistic voice clone from an audio sample."
      />
      <main className="flex-1">
        <PlaceholderPage 
          title="Voice Cloning"
          description="This is where you will be able to upload an audio file (.mp3, .wav) to create a voice clone using the ElevenLabs API."
        />
      </main>
    </>
  );
}
