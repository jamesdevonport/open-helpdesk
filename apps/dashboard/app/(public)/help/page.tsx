"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Search,
  ChevronRight,
  BookOpen,
  BarChart3,
  ShoppingBag,
  Code2,
  Mail,
  Puzzle,
  HelpCircle,
  Settings,
  LayoutGrid,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const categoryIcons: Record<string, React.ReactNode> = {
  Analytics: <BarChart3 className="h-5 w-5" />,
  "Checkout Surveys": <ShoppingBag className="h-5 w-5" />,
  "Developer Documentation": <Code2 className="h-5 w-5" />,
  "Email Surveys": <Mail className="h-5 w-5" />,
  Integrations: <Puzzle className="h-5 w-5" />,
  Questions: <HelpCircle className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  "App Block Surveys": <LayoutGrid className="h-5 w-5" />,
  "Popup Surveys": <MousePointerClick className="h-5 w-5" />,
};

export default function HelpHomePage() {
  const [search, setSearch] = useState("");
  const publicContext = useQuery(api.organizations.getPublicContext);
  const organizationId = publicContext?.organizationId;
  const brandColor = publicContext?.widgetColor ?? "#1977f2";
  const organizationName = publicContext?.name ?? "your workspace";

  const collections = useQuery(
    api.collections.list,
    organizationId ? { organizationId } : "skip"
  );
  const categories = useQuery(
    api.categories.list,
    organizationId ? { organizationId } : "skip"
  );
  const articles = useQuery(
    api.articles.listPublished,
    organizationId ? { organizationId } : "skip"
  );
  const searchResults = useQuery(
    api.articles.search,
    organizationId && search.length > 2
      ? { organizationId, query: search }
      : "skip"
  );

  const isSearching = search.length > 2;

  if (publicContext === undefined) {
    return <LoadingState brandColor={brandColor} />;
  }

  if (publicContext === null) {
    return <EmptySetupState />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div style={{ background: brandColor }}>
        <div className="mx-auto max-w-4xl px-6 pb-14 pt-12">
          <div className="mb-8 flex items-center justify-center">
            <img
              src="/open-helpdesk-logo-white.svg"
              alt={organizationName}
              className="h-7"
            />
          </div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What can we help you with?
          </h1>
          <p className="mt-3 text-center text-base text-white/70">
            Find answers, guides, and tutorials for {organizationName}.
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for articles..."
              autoFocus
              className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-[15px] text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {isSearching && (
          <div>
            <p className="mb-4 text-sm text-gray-500">
              {searchResults?.length || 0} result
              {searchResults?.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
            {searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((article) => (
                  <Link
                    key={article._id}
                    href={`/help/${article.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 transition-colors">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="mt-0.5 truncate text-sm text-gray-500">
                          {article.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-gray-300 transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
                <p className="text-gray-500">
                  No articles found. Try a different search term.
                </p>
              </div>
            )}
          </div>
        )}

        {!isSearching && (
          <>
            {collections?.map((collection) => {
              const collectionCategories =
                categories?.filter((category) => category.collectionId === collection._id) ?? [];
              if (collectionCategories.length === 0) return null;

              return (
                <div key={collection._id} className="mb-10">
                  <h2 className="mb-1 text-lg font-semibold text-gray-900">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="mb-5 text-sm text-gray-500">
                      {collection.description}
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {collectionCategories.map((category) => {
                      const count =
                        articles?.filter((article) => article.categoryId === category._id)
                          .length ?? 0;

                      return (
                        <CategoryCard
                          key={category._id}
                          slug={category.slug}
                          name={category.name}
                          description={category.description}
                          articleCount={count}
                          brandColor={brandColor}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {(() => {
              const uncategorized =
                categories?.filter((category) => !category.collectionId) ?? [];
              if (uncategorized.length === 0) return null;

              return (
                <div className="mb-10">
                  <h2 className="mb-5 text-lg font-semibold text-gray-900">
                    More Topics
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {uncategorized.map((category) => {
                      const count =
                        articles?.filter((article) => article.categoryId === category._id)
                          .length ?? 0;

                      return (
                        <CategoryCard
                          key={category._id}
                          slug={category.slug}
                          name={category.name}
                          description={category.description}
                          articleCount={count}
                          brandColor={brandColor}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const uncategorizedArticles =
                articles?.filter((article) => !article.categoryId) ?? [];
              if (uncategorizedArticles.length === 0) return null;

              return (
                <div className="mb-10">
                  <h2 className="mb-5 text-lg font-semibold text-gray-900">General</h2>
                  <div className="space-y-2">
                    {uncategorizedArticles.map((article) => (
                      <Link
                        key={article._id}
                        href={`/help/${article.slug}`}
                        className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 transition-colors">
                            {article.title}
                          </h3>
                          {article.description && (
                            <p className="mt-0.5 truncate text-sm text-gray-500">
                              {article.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-gray-300 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-10">
        <Link
          href="/help/updates"
          className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${brandColor}14`, color: brandColor }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Product Updates</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                See the latest features, improvements, and changes.
              </p>
            </div>
          </div>
          <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-gray-300" />
        </Link>
      </div>

      <div className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10 text-center">
          <h3 className="text-base font-semibold text-gray-900">Still need help?</h3>
          <p className="mt-1 text-sm text-gray-500">
            Our support team is ready to assist you.
          </p>
          <button
            onClick={() => (window as any).OpenHelpdesk?.openChat()}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            <Mail className="h-4 w-4" />
            Chat with us
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ brandColor }: { brandColor: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: brandColor, borderTopColor: "transparent" }}
      />
    </div>
  );
}

function EmptySetupState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          Help center setup is not complete
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Finish the first-run setup at{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">/setup</code> to
          create your workspace and publish your help center.
        </p>
      </div>
    </div>
  );
}

function CategoryCard({
  slug,
  name,
  description,
  articleCount,
  brandColor,
}: {
  slug: string;
  name: string;
  description?: string;
  articleCount: number;
  brandColor: string;
}) {
  const icon = categoryIcons[name] || <BookOpen className="h-5 w-5" />;

  return (
    <Link
      href={`/help/category/${slug}`}
      className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
        style={{ backgroundColor: `${brandColor}14`, color: brandColor }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{description}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {articleCount} article{articleCount !== 1 ? "s" : ""}
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
    </Link>
  );
}
