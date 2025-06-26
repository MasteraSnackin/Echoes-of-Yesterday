import { DashboardHeader } from "@/components/dashboard-header";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function SieveAskPage() {
  return (
    <>
      <DashboardHeader
        title="Ask Sieve"
        description="Upload media and ask a question about it."
      />
      <main className="flex-1">
        <PlaceholderPage 
          title="Ask Sieve"
          description="This is where you will be able to upload a media file or provide a URL and ask questions to be answered by the Sieve API."
        />
      </main>
    </>
  );
}
