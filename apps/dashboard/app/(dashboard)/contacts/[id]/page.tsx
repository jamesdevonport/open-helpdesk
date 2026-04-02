"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Mail,
  User,
  Clock,
  Globe,
  MapPin,
  Tag,
  MessageSquare,
  Plus,
  X,
  Monitor,
  Languages,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const contact = useQuery(api.contacts.get, {
    contactId: id as Id<"contacts">,
  });

  const conversations = useQuery(api.contacts.getConversations, {
    contactId: id as Id<"contacts">,
  });

  const addTag = useMutation(api.contacts.addTag);
  const removeTag = useMutation(api.contacts.removeTag);

  if (!contact) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const displayName = contact.name || contact.email || "Anonymous";

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag({ contactId: id as Id<"contacts">, tag: newTag.trim() });
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const location = [
    contact.browserInfo?.city,
    contact.browserInfo?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link
          href="/contacts"
          className="rounded-md p-1 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-text-primary">
          Contact
        </h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Avatar name={displayName} avatarUrl={contact.avatarUrl} size="lg" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {displayName}
              </h2>
              {contact.email && (
                <p className="text-[13px] text-text-secondary">
                  {contact.email}
                </p>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {contact.externalId && (
              <InfoCard
                icon={<User className="h-4 w-4" />}
                label="External ID"
                value={contact.externalId}
              />
            )}
            <InfoCard
              icon={<Clock className="h-4 w-4" />}
              label="First seen"
              value={formatRelativeTime(contact.firstSeenAt)}
            />
            <InfoCard
              icon={<Clock className="h-4 w-4" />}
              label="Last seen"
              value={formatRelativeTime(contact.lastSeenAt)}
            />
            {location && (
              <InfoCard
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={location}
              />
            )}
            {contact.browserInfo?.timezone && (
              <InfoCard
                icon={<Globe className="h-4 w-4" />}
                label="Timezone"
                value={contact.browserInfo.timezone}
              />
            )}
            {contact.browserInfo?.language && (
              <InfoCard
                icon={<Languages className="h-4 w-4" />}
                label="Language"
                value={contact.browserInfo.language}
              />
            )}
            {contact.browserInfo?.screenResolution && (
              <InfoCard
                icon={<Monitor className="h-4 w-4" />}
                label="Screen"
                value={contact.browserInfo.screenResolution}
              />
            )}
          </div>

          {contact.browserInfo?.currentUrl && (
            <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                Last page
              </div>
              <p className="mt-1 truncate text-[13px] text-text-secondary">
                {contact.browserInfo.currentUrl}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(contact.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2.5 py-1 text-[11px] font-medium text-primary-700"
                >
                  {tag}
                  <button
                    onClick={() =>
                      removeTag({ contactId: id as Id<"contacts">, tag })
                    }
                    className="rounded-full p-0.5 hover:bg-primary-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag();
                    if (e.key === "Escape") setShowTagInput(false);
                  }}
                  onBlur={() => {
                    if (newTag.trim()) handleAddTag();
                    else setShowTagInput(false);
                  }}
                  autoFocus
                  placeholder="Tag name"
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-text-tertiary hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          {contact.metadata &&
            Object.keys(contact.metadata as Record<string, unknown>).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">
                    Custom Data
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface divide-y divide-border-light">
                  {Object.entries(contact.metadata as Record<string, unknown>).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-2.5 text-[12px]"
                      >
                        <span className="text-text-tertiary font-medium">{key}</span>
                        <span className="text-text-secondary font-mono">
                          {String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Conversations */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">
                Conversations
              </span>
            </div>
            <div className="space-y-2">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <Link
                    key={conv._id}
                    href={`/conversations?id=${conv._id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-primary">
                        {conv.lastMessagePreview || "No messages"}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {conv.channel} &middot; {formatRelativeTime(conv.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        conv.status === "open"
                          ? "primary"
                          : conv.status === "resolved"
                            ? "success"
                            : "default"
                      }
                    >
                      {conv.status}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <MessageSquare className="mx-auto h-5 w-5 text-text-tertiary" />
                  <p className="mt-2 text-[13px] text-text-tertiary">
                    No conversations yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-medium text-text-tertiary">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[13px] font-medium text-text-primary truncate">
        {value}
      </p>
    </div>
  );
}
