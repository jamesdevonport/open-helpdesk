"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ConversationList } from "@/components/conversations/ConversationList";
import { MessageThread } from "@/components/conversations/MessageThread";
import { MessageComposer } from "@/components/conversations/MessageComposer";
import { ConversationSidebar } from "@/components/conversations/ConversationSidebar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare,
  Inbox,
  CheckCircle,
  Clock,
  Archive,
  PanelRightOpen,
  PanelRightClose,
  Search,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { label: "All", value: undefined, icon: Inbox },
  { label: "Open", value: "open", icon: MessageSquare },
  { label: "Pending", value: "pending", icon: Clock },
  { label: "Resolved", value: "resolved", icon: CheckCircle },
  { label: "Closed", value: "closed", icon: Archive },
] as const;

export default function ConversationsPage() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-select conversation from URL query param (e.g. ?id=xxx)
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && !selectedId) {
      setSelectedId(idParam);
    }
  }, [searchParams, selectedId]);

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const conversations = useQuery(
    api.conversations.list,
    orgId && !searchQuery
      ? { organizationId: orgId, status: statusFilter }
      : "skip"
  );

  const searchResults = useQuery(
    api.conversations.search,
    orgId && searchQuery.length > 1
      ? { organizationId: orgId, query: searchQuery }
      : "skip"
  );

  const displayedConversations =
    searchQuery.length > 1 ? searchResults : conversations;

  const selectedConversation = useQuery(
    api.conversations.get,
    selectedId
      ? { conversationId: selectedId as Id<"conversations"> }
      : "skip"
  );

  const messages = useQuery(
    api.messages.list,
    selectedId
      ? { conversationId: selectedId as Id<"conversations"> }
      : "skip"
  );

  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.conversations.markRead);
  const updateStatus = useMutation(api.conversations.updateStatus);

  useEffect(() => {
    if (!selectedId) return;

    void markRead({
      conversationId: selectedId as Id<"conversations">,
      reader: "agent",
    });
  }, [selectedId, markRead]);

  const handleResolve = async (conversationId: string) => {
    await updateStatus({
      conversationId: conversationId as Id<"conversations">,
      status: "resolved",
    });
  };

  const handleReopen = async (conversationId: string) => {
    await updateStatus({
      conversationId: conversationId as Id<"conversations">,
      status: "open",
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleSend = async (
    body: string,
    attachments?: { name: string; url: string; contentType: string; size: number }[]
  ) => {
    if (!selectedId) return;
    await sendMessage({
      conversationId: selectedId as Id<"conversations">,
      senderType: "agent",
      body,
      attachments,
    });
  };

  const handleSendArticle = async (articleId: string, _title: string) => {
    if (!selectedId) return;
    await sendMessage({
      conversationId: selectedId as Id<"conversations">,
      senderType: "agent",
      body: "",
      articleId: articleId as Id<"articles">,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation list panel */}
      <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-surface overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[15px] font-semibold text-text-primary">
              Conversations
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-border px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-border bg-surface-secondary py-1.5 pl-8 pr-3 text-[12px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Status filters */}
        {!searchQuery && (
          <div className="shrink-0 flex gap-1 border-b border-border px-3 py-2 overflow-x-auto">
            {filters.map(({ label, value, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  statusFilter === value
                    ? "bg-primary-50 text-primary-700"
                    : "text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {displayedConversations && displayedConversations.length > 0 ? (
            <ConversationList
              conversations={displayedConversations}
              selectedId={selectedId}
              onSelect={handleSelect}
              onResolve={handleResolve}
              onReopen={handleReopen}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No conversations"
              description="Conversations will appear here when customers reach out."
            />
          )}
        </div>
      </div>

      {/* Message thread panel */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {selectedConversation && messages ? (
          <>
            {/* Thread header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-text-primary">
                  {selectedConversation.contact?.name ||
                    selectedConversation.contact?.email ||
                    "Anonymous"}
                </h2>
                <Badge
                  variant={
                    selectedConversation.status === "open"
                      ? "primary"
                      : selectedConversation.status === "resolved"
                        ? "success"
                        : "default"
                  }
                >
                  {selectedConversation.status}
                </Badge>
                {selectedConversation.channel === "email" && (
                  <span className="text-[11px] text-text-tertiary">via email</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedConversation.status === "resolved" || selectedConversation.status === "closed" ? (
                  <button
                    onClick={() => handleReopen(selectedConversation._id)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => handleResolve(selectedConversation._id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[12px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary transition-colors"
                >
                  {showSidebar ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessageThread
                messages={messages}
                conversationId={selectedId}
                contactName={
                  selectedConversation.contact?.name ||
                  selectedConversation.contact?.email
                }
                contactAvatarUrl={selectedConversation.contact?.avatarUrl}
                contactHasEmail={!!selectedConversation.contact?.email}
              />
            </div>

            {/* Composer */}
            <div className="shrink-0">
              <MessageComposer
                conversationId={selectedId}
                contactName={
                  selectedConversation.contact?.name ||
                  selectedConversation.contact?.email
                }
                onSend={handleSend}
                onSendArticle={handleSendArticle}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-surface-secondary">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                <MessageSquare className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-text-primary">
                Select a conversation
              </h3>
              <p className="mt-1 text-[12px] text-text-tertiary">
                Choose a conversation from the list to view messages.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contact sidebar */}
      {showSidebar &&
        selectedConversation &&
        selectedConversation.contact && (
          <div className="shrink-0 overflow-hidden">
            <ConversationSidebar
              contact={selectedConversation.contact as any}
              conversation={selectedConversation}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        )}
    </div>
  );
}
