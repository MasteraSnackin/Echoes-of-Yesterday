import { DashboardHeader } from "@/components/dashboard-header";
import { MemoryForm } from "@/components/features/memory-form";

export default function MemoryIntegrationPage() {
  return (
    <>
      <DashboardHeader
        title="Memory Integration"
        description="Shape the AI's personality with stories and memories."
      />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <MemoryForm />
        </div>
      </main>
    </>
  );
}
