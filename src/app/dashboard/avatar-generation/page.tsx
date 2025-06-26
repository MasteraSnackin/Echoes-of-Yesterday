import { DashboardHeader } from "@/components/dashboard-header";
import { AvatarGenerator } from "@/components/features/avatar-generator";

export default function AvatarGenerationPage() {
  return (
    <>
      <DashboardHeader
        title="Avatar Generation"
        description="Create a visual representation from a photograph."
      />
      <main className="flex-1 p-6">
        <AvatarGenerator />
      </main>
    </>
  );
}
