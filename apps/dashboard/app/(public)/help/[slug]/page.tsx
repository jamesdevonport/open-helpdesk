"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

function processContent(content: string) {
  return content.replace(
    /\$\{youtube\}\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, title, id) => {
      const videoId = id.split("?")[0];
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.5em 0"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
    }
  );
}

export default function PublicArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const publicContext = useQuery(api.organizations.getPublicContext);
  const organizationId = publicContext?.organizationId;
  const brandColor = publicContext?.widgetColor ?? "#1977f2";

  const article = useQuery(
    api.articles.getBySlug,
    organizationId ? { organizationId, slug } : "skip"
  );
  const recordFeedback = useMutation(api.articles.recordFeedback);

  const handleFeedback = async (helpful: boolean) => {
    if (!article || feedbackGiven !== null) return;
    setFeedbackGiven(helpful);
    await recordFeedback({ articleId: article._id, helpful });
  };

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
          Finish the initial workspace bootstrap before publishing articles.
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

  if (article === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: brandColor, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (article === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
        <p className="mt-2 text-gray-500">
          This article may have been moved or deleted.
        </p>
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

  const category = article.category;

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
            {category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link
                  href={`/help/category/${category.slug}`}
                  className="transition-colors hover:text-[#1977f2]"
                >
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="max-w-[200px] truncate text-gray-600">
              {article.title}
            </span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-3 text-base leading-relaxed text-gray-500">
              {article.description}
            </p>
          )}

          <div className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#1977f2] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl mt-8 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {processContent(article.content)}
            </ReactMarkdown>
          </div>

          <div className="mt-12 border-t border-gray-100 pt-8">
            {feedbackGiven === null ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Was this article helpful?
                </p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">
                {feedbackGiven
                  ? "Thanks for letting us know!"
                  : "Thanks for your feedback. We'll work on improving this article."}
              </p>
            )}
          </div>
        </article>

        {category && organizationId && (
          <RelatedArticles
            organizationId={organizationId}
            categoryId={category._id}
            categoryName={category.name}
            categorySlug={category.slug}
            currentSlug={slug}
            brandColor={brandColor}
          />
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

function RelatedArticles({
  organizationId,
  categoryId,
  categoryName,
  categorySlug,
  currentSlug,
  brandColor,
}: {
  organizationId: Id<"organizations">;
  categoryId: Id<"categories">;
  categoryName: string;
  categorySlug: string;
  currentSlug: string;
  brandColor: string;
}) {
  const articles = useQuery(api.articles.listPublished, {
    organizationId,
    categoryId,
  });

  const related = articles?.filter((article) => article.slug !== currentSlug).slice(0, 4);
  if (!related || related.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          More from {categoryName}
        </h3>
        <Link
          href={`/help/category/${categorySlug}`}
          className="text-xs font-medium hover:opacity-80"
          style={{ color: brandColor }}
        >
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {related.map((article) => (
          <Link
            key={article._id}
            href={`/help/${article.slug}`}
            className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3.5 transition-all hover:shadow-md"
          >
            <h4 className="truncate text-sm font-medium text-gray-700">
              {article.title}
            </h4>
            <ChevronRight className="ml-3 h-3.5 w-3.5 shrink-0 text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
