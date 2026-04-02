"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  new_feature: "New Feature",
  improvement: "Improvement",
  major_version: "Major Version",
};

const typeColors: Record<string, string> = {
  new_feature: "#059669",
  improvement: "#2563eb",
  major_version: "#7c3aed",
};

function formatDate(timestamp?: number): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpdateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const publicContext = useQuery(api.organizations.getPublicContext);
  const organizationId = publicContext?.organizationId;
  const brandColor = publicContext?.widgetColor ?? "#1977f2";

  const update = useQuery(
    api.productUpdates.getBySlug,
    organizationId ? { organizationId, slug } : "skip"
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
          Run the initial setup before publishing product updates.
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

  if (update === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: brandColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (update === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Update not found</h1>
        <p className="mt-2 text-gray-500">
          This update may have been moved or deleted.
        </p>
        <Link
          href="/help/updates"
          className="mt-6 text-sm font-medium hover:opacity-80"
          style={{ color: brandColor }}
        >
          Back to Product Updates
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

      <div className="mx-auto max-w-3xl px-6 py-10">
        <article className="rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-sm sm:px-12">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/help" className="transition-colors hover:text-[#1977f2]">
              Help Center
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/help/updates"
              className="transition-colors hover:text-[#1977f2]"
            >
              Updates
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="max-w-[200px] truncate text-gray-600">
              {update.title}
            </span>
          </nav>

          <div className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${typeColors[update.type] || brandColor}14`,
                color: typeColors[update.type] || brandColor,
              }}
            >
              {typeLabels[update.type] || update.type}
            </span>
            <span className="text-sm text-gray-400">
              {formatDate(update.publishedAt)}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {update.title}
          </h1>

          {update.imageUrl && (
            <div className="mt-6">
              <img
                src={update.imageUrl}
                alt=""
                className="w-full rounded-xl border border-gray-100"
              />
            </div>
          )}

          {update.videoEmbed && (
            <div
              className="mt-6 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl"
              dangerouslySetInnerHTML={{ __html: update.videoEmbed }}
            />
          )}

          <div className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#1977f2] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl mt-8 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {update.description}
            </ReactMarkdown>
          </div>
        </article>

        <div className="mt-6 text-center">
          <Link
            href="/help/updates"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: brandColor }}
          >
            View all updates
          </Link>
        </div>
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
