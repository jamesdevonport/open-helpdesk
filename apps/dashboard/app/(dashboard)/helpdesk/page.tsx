"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  ThumbsUp,
  ChevronRight,
  FolderOpen,
  Package,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HelpdeskPage() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >();
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const [search, setSearch] = useState("");

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const collections = useQuery(
    api.collections.list,
    orgId ? { organizationId: orgId } : "skip"
  );

  const categories = useQuery(
    api.categories.list,
    orgId
      ? {
          organizationId: orgId,
          collectionId: selectedCollectionId
            ? (selectedCollectionId as Id<"collections">)
            : undefined,
        }
      : "skip"
  );

  const articles = useQuery(
    api.articles.list,
    orgId
      ? {
          organizationId: orgId,
          categoryId: selectedCategoryId
            ? (selectedCategoryId as Id<"categories">)
            : undefined,
        }
      : "skip"
  );

  const searchResults = useQuery(
    api.articles.search,
    orgId && search.length > 2
      ? { organizationId: orgId, query: search }
      : "skip"
  );

  const displayedArticles = search.length > 2 ? searchResults : articles;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex w-[240px] flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-semibold text-text-primary">
            Help Desk
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* All articles */}
          <button
            onClick={() => {
              setSelectedCollectionId(undefined);
              setSelectedCategoryId(undefined);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              !selectedCollectionId && !selectedCategoryId
                ? "bg-primary-50 text-primary-700"
                : "text-text-secondary hover:bg-surface-tertiary"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            All Articles
          </button>

          {/* Collections with nested categories */}
          {collections?.map((collection) => (
            <div key={collection._id} className="mt-3">
              <button
                onClick={() => {
                  setSelectedCollectionId(
                    selectedCollectionId === collection._id
                      ? undefined
                      : collection._id
                  );
                  setSelectedCategoryId(undefined);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors",
                  selectedCollectionId === collection._id &&
                    !selectedCategoryId
                    ? "bg-primary-50 text-primary-700"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <Package className="h-3.5 w-3.5" />
                <span className="truncate">{collection.name}</span>
              </button>

              {/* Show categories under this collection */}
              {categories &&
                selectedCollectionId === collection._id &&
                categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg py-1.5 pl-8 pr-3 text-[13px] font-medium transition-colors",
                      selectedCategoryId === cat._id
                        ? "bg-primary-50 text-primary-700"
                        : "text-text-secondary hover:bg-surface-tertiary"
                    )}
                  >
                    {cat.icon ? (
                      <span>{cat.icon}</span>
                    ) : (
                      <FolderOpen className="h-3 w-3" />
                    )}
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
            </div>
          ))}

          {/* Uncategorized — categories not in any collection */}
          {categories &&
            !selectedCollectionId &&
            categories
              .filter((cat) => !cat.collectionId)
              .map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategoryId(cat._id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors mt-1",
                    selectedCategoryId === cat._id
                      ? "bg-primary-50 text-primary-700"
                      : "text-text-secondary hover:bg-surface-tertiary"
                  )}
                >
                  {cat.icon ? (
                    <span>{cat.icon}</span>
                  ) : (
                    <FolderOpen className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
        </div>
      </div>

      {/* Article list */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="text-[15px] font-semibold text-text-primary">
            {selectedCollectionId
              ? collections?.find((c) => c._id === selectedCollectionId)
                  ?.name || "Articles"
              : "All Articles"}
          </h1>
          <Link
            href="/helpdesk/new"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Article
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
              placeholder="Search articles..."
              className="w-full rounded-lg border border-border bg-surface-secondary py-2 pl-9 pr-4 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-auto">
          {displayedArticles && displayedArticles.length > 0 ? (
            <div className="divide-y divide-border-light">
              {displayedArticles.map((article) => (
                <Link
                  key={article._id}
                  href={`/helpdesk/${article._id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-secondary"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-medium text-text-primary">
                        {article.title}
                      </h3>
                      <Badge
                        variant={
                          article.status === "published"
                            ? "success"
                            : "warning"
                        }
                      >
                        {article.status}
                      </Badge>
                      {article.featured && (
                        <Badge variant="primary">Featured</Badge>
                      )}
                    </div>
                    {article.description && (
                      <p className="mt-0.5 truncate text-[12px] text-text-tertiary">
                        {article.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.helpfulCount || 0}
                      </span>
                      <span>
                        Updated {formatRelativeTime(article.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No articles"
              description="Create your first help desk article."
              action={
                <Link
                  href="/helpdesk/new"
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Article
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
