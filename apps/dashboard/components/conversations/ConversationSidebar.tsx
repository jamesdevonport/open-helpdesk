"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronDown,
  Clock,
  Copy,
  Check,
  Database,
  Globe,
  LogIn,
  Mail,
  MapPin,
  Monitor,
  Tag,
  User,
  UserCog,
  X,
  Eye,
  ExternalLink,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Contact {
  _id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  externalId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  firstSeenAt: number;
  lastSeenAt: number;
  browserInfo?: {
    currentUrl?: string;
    timezone?: string;
    language?: string;
    userAgent?: string;
    screenResolution?: string;
    country?: string;
    countryCode?: string;
    city?: string;
  };
}

interface Conversation {
  status: string;
  channel: string;
  createdAt: number;
  assignedAgent?: {
    name: string;
  } | null;
}

export function ConversationSidebar({
  contact,
  conversation,
  onClose,
}: {
  contact: Contact;
  conversation: Conversation;
  onClose: () => void;
}) {
  const displayName = contact.name || contact.email || "Anonymous";

  const pageViews = useQuery(api.pageViews.listByContact, {
    contactId: contact._id as Id<"contacts">,
  });

  const deviceInfo = contact.browserInfo?.userAgent
    ? parseUserAgent(contact.browserInfo.userAgent)
    : null;

  const location = [contact.browserInfo?.city, contact.browserInfo?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-semibold text-text-primary">
          Contact Info
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contact header */}
        <div className="flex flex-col items-center border-b border-border-light px-4 py-5">
          <Avatar name={displayName} avatarUrl={contact.avatarUrl} size="lg" />
          <h4 className="mt-2 text-[14px] font-semibold text-text-primary">
            {displayName}
          </h4>
          {contact.email && (
            <p className="mt-0.5 text-[12px] text-text-secondary">
              {contact.email}
            </p>
          )}
          {location && (
            <p className="mt-0.5 text-[11px] text-text-tertiary flex items-center gap-1">
              {contact.browserInfo?.countryCode && (
                <span className="text-[13px] leading-none">
                  {countryCodeToFlag(contact.browserInfo.countryCode)}
                </span>
              )}
              {location}
            </p>
          )}
          <Link
            href={`/contacts/${contact._id}`}
            className="mt-2 text-[11px] font-medium text-primary-600 hover:text-primary-700"
          >
            View profile
          </Link>
        </div>

        {/* Custom Data */}
        {contact.metadata &&
          Object.keys(contact.metadata).length > 0 && (
            <CollapsibleSection title="Details" icon={Database}>
              <div className="space-y-2">
                {Object.entries(contact.metadata).map(([key, value]) => {
                  const label = formatMetadataKey(key);
                  const strVal = String(value);
                  if (!strVal) return null;
                  const isUrl =
                    strVal.startsWith("http://") ||
                    strVal.startsWith("https://");

                  return (
                    <div key={key} className="flex items-center justify-between text-[12px] group">
                      <span className="text-text-tertiary">{label}</span>
                      <div className="flex items-center gap-1.5">
                        {isUrl ? (
                          <a
                            href={strVal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 truncate max-w-[140px]"
                          >
                            {(() => { try { return new URL(strVal).hostname; } catch { return strVal; } })()}
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-text-secondary truncate max-w-[140px]">
                            {strVal}
                          </span>
                        )}
                        <CopyButton value={strVal} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {String((contact.metadata as Record<string, unknown>).userId || (contact.metadata as Record<string, unknown>).userID || "") !== "" && (
                <a
                  href={`https://bubble.io/appeditor/authenticate_as/open-helpdesk/live/${String((contact.metadata as Record<string, unknown>).userId || (contact.metadata as Record<string, unknown>).userID)}/true/home`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-[12px] font-medium text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log in as user
                </a>
              )}
            </CollapsibleSection>
          )}

        {/* Conversation Routing */}
        <CollapsibleSection title="Conversation Routing" icon={UserCog}>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary">Status</span>
              <Badge
                variant={
                  conversation.status === "open"
                    ? "primary"
                    : conversation.status === "resolved"
                      ? "success"
                      : "default"
                }
              >
                {conversation.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Channel</span>
              <span className="text-text-secondary capitalize">{conversation.channel}</span>
            </div>
            {conversation.assignedAgent && (
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">Assigned to</span>
                <span className="text-text-secondary">{conversation.assignedAgent.name}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Main Information */}
        <CollapsibleSection title="Main Information" icon={User}>
          <div className="space-y-2.5">
            {contact.email && (
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={contact.email} copyable />
            )}
            {contact.externalId && (
              <InfoRow icon={<User className="h-3.5 w-3.5" />} label="ID" value={contact.externalId} copyable />
            )}
            <InfoRow
              icon={<Clock className="h-3.5 w-3.5" />}
              value={`First seen ${formatRelativeTime(contact.firstSeenAt)}`}
            />
            {location && (
              <InfoRow
                icon={
                  contact.browserInfo?.countryCode ? (
                    <span className="text-[14px] leading-none">
                      {countryCodeToFlag(contact.browserInfo.countryCode)}
                    </span>
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )
                }
                value={
                  contact.browserInfo?.timezone
                    ? `${location} (${contact.browserInfo.timezone})`
                    : location
                }
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Visitor Device */}
        <CollapsibleSection title="Visitor Device" icon={Monitor} defaultOpen={false}>
          <div className="space-y-2.5">
            {deviceInfo && (
              <InfoRow icon={<Globe className="h-3.5 w-3.5" />} value={deviceInfo} />
            )}
            {contact.browserInfo?.screenResolution && (
              <InfoRow icon={<Monitor className="h-3.5 w-3.5" />} value={contact.browserInfo.screenResolution} />
            )}
            {contact.browserInfo?.currentUrl && (
              <div className="flex items-start gap-2.5">
                <Globe className="h-3.5 w-3.5 shrink-0 text-text-tertiary mt-0.5" />
                <a
                  href={contact.browserInfo.currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary-600 hover:text-primary-700 truncate"
                >
                  {extractPath(contact.browserInfo.currentUrl)}
                </a>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Page Views */}
        <CollapsibleSection title="Page Views" icon={Eye} defaultOpen={false}>
          {pageViews && pageViews.length > 0 ? (
            <div className="space-y-1">
              {pageViews.map((pv) => {
                const pathname = extractPath(pv.url);
                return (
                  <div
                    key={pv._id}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-surface-tertiary transition-colors group"
                  >
                    <Globe className="h-3 w-3 shrink-0 text-text-tertiary mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-text-primary truncate">
                        {pv.title || pathname}
                      </p>
                      <p className="text-[10px] text-text-tertiary">
                        {formatRelativeTime(pv.viewedAt)}
                      </p>
                    </div>
                    <a
                      href={pv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3 text-text-tertiary hover:text-primary-600" />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-[11px] text-text-tertiary">
              No page views recorded
            </span>
          )}
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection title="Tags" icon={Tag}>
          <div className="flex flex-wrap gap-1.5">
            {(contact.tags || []).map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
            {(!contact.tags || contact.tags.length === 0) && (
              <span className="text-[11px] text-text-tertiary">
                No tags yet
              </span>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// ── Inline Components ──────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-light">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="text-[12px] font-semibold text-text-secondary">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-tertiary transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  copyable,
}: {
  icon: React.ReactNode;
  label?: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 group">
      <span className="shrink-0 text-text-tertiary">{icon}</span>
      <span className="text-[12px] text-text-secondary truncate flex-1">
        {label && <span className="text-text-tertiary">{label}: </span>}
        {value}
      </span>
      {copyable && <CopyButton value={value} />}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-surface-tertiary"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 text-text-tertiary" />
      )}
    </button>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function formatMetadataKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function parseUserAgent(ua: string): string | null {
  if (!ua) return null;
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";

  return `${browser} on ${os}`;
}
