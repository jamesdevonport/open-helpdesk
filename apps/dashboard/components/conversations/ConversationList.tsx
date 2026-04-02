"use client";

import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronRight, Reply, CheckCircle2, RotateCcw } from "lucide-react";

interface Conversation {
  _id: string;
  status: string;
  channel: string;
  lastMessageAt: number;
  lastMessagePreview?: string;
  lastMessageSender?: string;
  unreadByAgent: boolean;
  contact?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  assignedAgent?: {
    name: string;
  } | null;
}

function statusDotColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-primary-500";
    case "pending":
      return "bg-amber-500";
    case "resolved":
      return "bg-emerald-500";
    default:
      return "bg-gray-300";
  }
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onResolve,
  onReopen,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onResolve?: (id: string) => void;
  onReopen?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const isSelected = conv._id === selectedId;
        const contactName =
          conv.contact?.name || conv.contact?.email || "Anonymous";
        const isOpen = conv.status === "open" || conv.status === "pending";

        return (
          <div
            key={conv._id}
            className={cn(
              "group relative transition-colors",
              isSelected
                ? "bg-primary-50 border-l-2 border-l-primary-500"
                : "hover:bg-surface-secondary border-l-2 border-l-transparent",
              conv.unreadByAgent && !isSelected && "bg-[#f0f7ff]"
            )}
          >
            <button
              onClick={() => onSelect(conv._id)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
            >
              <Avatar
                name={contactName}
                avatarUrl={conv.contact?.avatarUrl}
                size="md"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={cn(
                        "truncate text-[13px]",
                        conv.unreadByAgent
                          ? "font-semibold text-text-primary"
                          : "font-medium text-text-primary"
                      )}
                    >
                      {contactName}
                    </span>
                    {conv.assignedAgent && (
                      <span className="flex items-center gap-0.5 text-[11px] text-text-tertiary shrink-0">
                        <ChevronRight className="h-2.5 w-2.5" />
                        {conv.assignedAgent.name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                    {conv.status !== "open" && (
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          statusDotColor(conv.status)
                        )}
                        title={conv.status}
                      />
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-1 truncate text-[12px] flex items-center gap-1",
                    conv.unreadByAgent
                      ? "font-medium text-text-primary"
                      : "text-text-tertiary"
                  )}
                >
                  {conv.lastMessageSender === "agent" && (
                    <Reply className="h-3 w-3 shrink-0 text-text-tertiary -scale-x-100" />
                  )}
                  {conv.lastMessagePreview
                    ? truncate(conv.lastMessagePreview, 70)
                    : "No messages yet"}
                </p>
              </div>
              {conv.unreadByAgent && (
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
              )}
            </button>

            {/* Quick action — resolve/reopen on hover */}
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {isOpen && onResolve && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve(conv._id);
                  }}
                  title="Resolve"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              )}
              {!isOpen && onReopen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReopen(conv._id);
                  }}
                  title="Reopen"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface text-text-tertiary hover:bg-surface-tertiary border border-border transition-colors shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
