"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const publicContext = useQuery(api.organizations.getPublicContext);
  const organizationId = publicContext?.organizationId;
  const brandColor = publicContext?.widgetColor ?? "#1977f2";

  const categories = useQuery(
    api.categories.list,
    organizationId ? { organizationId } : "skip"
  );
  const category = categories?.find((entry) => entry.slug === slug);
  const articles = useQuery(
    api.articles.listPublished,
    category && organizationId
      ? { organizationId, categoryId: category._id }
      : "skip"
  );

  if (publicContext === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: brandColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (publicContext === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Help center setup is not complete
        </h1>
        <p className="mt-2 text-gray-500">
          Run the initial setup before publishing help content.
        </p>
        <Link
          href="/setup"
          className="mt-6 text-sm font-medium hover:opacity-80"
          style={{ color: brandColor }}
        >
          Open setup
        </Link>
      </div>
    );
  }

  if (categories === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: brandColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <Link
          href="/help"
          className="mt-6 text-sm font-medium hover:opacity-80"
          style={{ color: brandColor }}
        >
          Back to Help Center
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div style={{ backgroundColor: brandColor }}>
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/help" className="transition-opacity hover:opacity-90">
            <img
              src="/open-helpdesk-logo-white.svg"
              alt={publicContext.name}
              className="h-5"
            />
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/help" className="transition-colors hover:text-[#1977f2]">
              Help Center
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-gray-700">{category.name}</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-base text-gray-500">{category.description}</p>
          )}
          <p className="mt-3 text-sm text-gray-400">
            {articles?.length || 0} article{articles?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {articles === undefined ? (
          <div className="flex justify-center py-12">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: brandColor, borderTopColor: "transparent" }}
            />
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-2">
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/help/${article.slug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900">{article.title}</h3>
                  {article.description && (
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {article.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
            <p className="text-gray-500">No articles in this category yet.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <p className="text-sm text-gray-400">
            Need more help?{" "}
            <button
              onClick={() => (window as any).OpenHelpdesk?.openChat()}
              className="cursor-pointer font-medium hover:opacity-80"
              style={{ color: brandColor }}
            >
              Chat with our support team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
