import { DashboardHeader } from "@/components/dashboard-header";
import { ChatInterface } from "@/components/features/chat-interface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookHeart, Image } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Chat"
        description="Converse with the AI-powered memorial."
      />
      <main className="flex-1 p-6 flex flex-col gap-4">
         <Alert>
            <BookHeart className="h-4 w-4" />
            <AlertTitle>Remember!</AlertTitle>
            <AlertDescription>
                The AI's personality is shaped by the content in the <a href="/dashboard/memory-integration" className="font-bold underline">Memories</a> tab and the avatar from <a href="/dashboard/avatar-generation" className="font-bold underline">Avatar Generation</a>.
            </AlertDescription>
        </Alert>
        <div className="flex-1">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
