import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getOfficialsDirectory, getResidentConversation } from "@/lib/chat-data";
import { ChatThread } from "@/components/chat/chat-thread";

export const metadata: Metadata = {
  title: "Messages · Barangay Libtangin",
};

export default async function ResidentMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}/messages`);

  const [conversation, officials] = await Promise.all([
    getResidentConversation(id),
    getOfficialsDirectory(),
  ]);
  const officialIds = officials.map((o) => o.id);

  return (
    <div className="flex h-[calc(100dvh-7rem)] w-full flex-col sm:h-[calc(100dvh-8rem)]">
      <div className="min-h-0 flex-1">
        <ChatThread
          mode="resident"
          conversationId={conversation.conversationId}
          initialMessages={conversation.messages}
          currentUserId={id}
          presenceUserIds={officialIds}
          peer={{ name: "Barangay officials" }}
          showAvatar={false}
          presenceStyle="desk"
          emptyTitle="Start the conversation"
          emptyBody="Send a message, photo, or file. Whoever is on duty at the barangay will reply here."
          notice="This goes to the barangay office. Any official on duty can read and reply — please don't share passwords or one-time codes here."
          framed={false}
        />
      </div>
    </div>
  );
}
