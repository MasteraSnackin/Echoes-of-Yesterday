import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function AiAvatarMultiPage() {
  return (
    <>
      <DashboardHeader
        title="AI Avatar (Multi)"
        description="This feature has been removed."
      />
      <main className="flex-1 p-6">
        <PlaceholderPage
          title="Feature Removed"
          description="The AI Avatar (Multi-Person) feature has been removed."
        />
      </main>
    </>
  );
}
