"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Eye, MapPin, ExternalLink, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VisitorsPage() {
  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;
  const [, setTick] = useState(0);
  const [startingFor, setStartingFor] = useState<string | null>(null);
  const startConversation = useMutation(api.conversations.startConversation);
  const router = useRouter();

  const visitors = useQuery(
    api.visitorPresence.listActive,
    orgId ? { organizationId: orgId } : "skip"
  );

  // Re-render every 10s to update relative times and status dots
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleStartConversation = async (contactId: string) => {
    setStartingFor(contactId);
    try {
      const conversationId = await startConversation({
        contactId: contactId as Id<"contacts">,
      });
      router.push(`/conversations?id=${conversationId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setStartingFor(null);
    }
  };

  const now = Date.now();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-text-primary">
            Visitors
          </h1>
          {visitors && visitors.length > 0 && (
            <Badge variant="success">{visitors.length} online</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {visitors && visitors.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Visitor
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Current Page
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Location
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Last Active
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                </th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor) => {
                const elapsed = now - visitor.lastActiveAt;
                const isActive = elapsed < 60_000;
                const location = [visitor.city, visitor.country]
                  .filter(Boolean)
                  .join(", ");

                // Extract path from URL for cleaner display
                let pagePath = visitor.currentUrl;
                try {
                  const url = new URL(visitor.currentUrl);
                  pagePath =
                    url.pathname === "/"
                      ? url.hostname
                      : url.pathname + url.search;
                } catch {}

                const isStarting = startingFor === visitor.contactId;

                return (
                  <tr
                    key={visitor.presenceId}
                    className="border-b border-border-light transition-colors hover:bg-surface-secondary"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/contacts/${visitor.contactId}`}
                        className="flex items-center gap-3"
                      >
                        <div className="relative">
                          <Avatar
                            name={visitor.name || visitor.email}
                            avatarUrl={visitor.avatarUrl}
                            size="sm"
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                              isActive ? "bg-emerald-500" : "bg-emerald-300"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-text-primary">
                            {visitor.name || "Anonymous"}
                          </p>
                          {visitor.email && (
                            <p className="text-[11px] text-text-tertiary">
                              {visitor.email}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div
                        className="flex items-center gap-1.5 max-w-[280px]"
                        title={visitor.currentUrl}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0 text-text-tertiary" />
                        <span className="truncate text-[13px] text-text-secondary">
                          {visitor.currentTitle || pagePath}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {location ? (
                        <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                          <MapPin className="h-3 w-3 text-text-tertiary" />
                          {location}
                        </div>
                      ) : (
                        <span className="text-[13px] text-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[12px] text-text-tertiary">
                        {isActive
                          ? "Just now"
                          : `${Math.floor(elapsed / 60_000)}m ago`}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleStartConversation(visitor.contactId)}
                        disabled={isStarting}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-50"
                      >
                        {isStarting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <MessageSquare className="h-3 w-3" />
                        )}
                        Send message
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Eye}
            title="No visitors online"
            description="Visitors will appear here when customers browse your site with the widget installed."
          />
        )}
      </div>
    </div>
  );
}
