import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { isOfficial } from "@/lib/roles";
import { getOfficialConversation } from "@/lib/chat-data";
import type { UserRoles } from "@/app/generated/prisma/enums";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function OfficialConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!isOfficial(session.user.roles as UserRoles[] | undefined)) {
    redirect("/start");
  }

  const conversation = await getOfficialConversation(conversationId);
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          This conversation no longer exists.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 w-full flex-1">
      <ChatThread
        mode="official"
        conversationId={conversation.conversationId}
        initialMessages={conversation.messages}
        currentUserId={session.user.id}
        presenceUserIds={[conversation.resident.id]}
        peer={{
          name: conversation.resident.name,
          image: conversation.resident.image,
          subtitle: "Resident",
        }}
        emptyTitle="No messages yet"
        emptyBody="Say hello. Your reply reaches the resident right away."
        notice="Shared desk — every barangay official can see this thread. You reply on behalf of the office."
      />
    </div>
  );
}
