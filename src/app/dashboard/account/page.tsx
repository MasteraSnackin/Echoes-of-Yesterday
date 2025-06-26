import { DashboardHeader } from "@/components/dashboard-header";
import { AccountForm } from "@/components/features/account-form";

export default function AccountPage() {
  return (
    <>
      <DashboardHeader
        title="Account Settings"
        description="Manage your API keys and application settings."
      />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <AccountForm />
        </div>
      </main>
    </>
  );
}
