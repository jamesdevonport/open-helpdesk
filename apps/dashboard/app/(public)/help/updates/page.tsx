"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpdatesPage() {
  const publicContext = useQuery(api.organizations.getPublicContext);
  const organizationId = publicContext?.organizationId;
  const brandColor = publicContext?.widgetColor ?? "#1977f2";

  const updates = useQuery(
    api.productUpdates.listPublished,
    organizationId ? { organizationId, limit: 50 } : "skip"
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

  if (updates === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: brandColor, borderTopColor: "transparent" }}
        />
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
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/help" className="transition-colors hover:text-[#1977f2]">
            Help Center
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600">Product Updates</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Product Updates
          </h1>
          <p className="mt-2 text-base text-gray-500">
            The latest features, improvements, and changes from {publicContext.name}.
          </p>
        </div>

        {updates.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
            <p className="text-gray-500">No updates yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <Link
                key={update._id}
                href={`/help/updates/${update.slug}`}
                className="block rounded-xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${typeColors[update.type] || brandColor}14`,
                      color: typeColors[update.type] || brandColor,
                    }}
                  >
                    {typeLabels[update.type] || update.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(update.publishedAt)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {update.title}
                </h2>
                {update.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">
                    {update.description.replace(/[#*`>\-\[\]()]/g, "").slice(0, 200)}
                  </p>
                )}
              </Link>
            ))}
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
