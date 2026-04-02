"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Megaphone,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  new_feature: "New Feature",
  improvement: "Improvement",
  major_version: "Major Version",
};

const typeVariants: Record<string, "success" | "primary" | "warning"> = {
  new_feature: "success",
  improvement: "primary",
  major_version: "warning",
};

export default function UpdatesPage() {
  const [search, setSearch] = useState("");

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const allUpdates = useQuery(
    api.productUpdates.list,
    orgId ? { organizationId: orgId } : "skip"
  );

  const draftUpdates = useQuery(
    api.productUpdates.list,
    orgId ? { organizationId: orgId, status: "draft" } : "skip"
  );

  const searchResults = useQuery(
    api.productUpdates.search,
    orgId && search.length > 2
      ? { organizationId: orgId, query: search }
      : "skip"
  );

  const combined = [
    ...(allUpdates || []),
    ...(draftUpdates || []),
  ];

  // Deduplicate by _id
  const seen = new Set<string>();
  const deduped = combined.filter((u) => {
    if (seen.has(u._id)) return false;
    seen.add(u._id);
    return true;
  });

  // Sort by publishedAt desc, then createdAt desc
  deduped.sort(
    (a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt)
  );

  const displayedUpdates = search.length > 2 ? searchResults : deduped;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">
          Product Updates
        </h1>
        <Link
          href="/updates/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New Update
        </Link>
      </div>

      {/* Search */}
      <div className="border-b border-border px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search updates..."
            className="w-full rounded-lg border border-border bg-surface-secondary py-2 pl-9 pr-4 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Updates list */}
      <div className="flex-1 overflow-auto">
        {displayedUpdates && displayedUpdates.length > 0 ? (
          <div className="divide-y divide-border-light">
            {displayedUpdates.map((update) => (
              <Link
                key={update._id}
                href={`/updates/${update._id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-secondary"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeVariants[update.type] || "primary"}>
                      {typeLabels[update.type] || update.type}
                    </Badge>
                    <h3 className="truncate text-[14px] font-medium text-text-primary">
                      {update.title}
                    </h3>
                    <Badge
                      variant={
                        update.status === "published" ? "success" : "warning"
                      }
                    >
                      {update.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-text-tertiary">
                    {update.description.slice(0, 120)}
                    {update.description.length > 120 ? "..." : ""}
                  </p>
                  <div className="mt-1.5 text-[11px] text-text-tertiary">
                    {update.publishedAt
                      ? `Published ${formatRelativeTime(update.publishedAt)}`
                      : `Created ${formatRelativeTime(update.createdAt)}`}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Megaphone}
            title="No updates"
            description="Create your first product update to share with users."
            action={
              <Link
                href="/updates/new"
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                New Update
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
