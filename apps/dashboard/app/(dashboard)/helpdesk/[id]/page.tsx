"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Save, Trash2, Eye, Edit, ExternalLink, Code, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const article = useQuery(
    api.articles.get,
    isNew ? "skip" : { articleId: id as Id<"articles"> }
  );

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const categories = useQuery(
    api.categories.list,
    orgId ? { organizationId: orgId } : "skip"
  );

  const updateArticle = useMutation(api.articles.update);
  const createArticle = useMutation(api.articles.create);
  const deleteArticle = useMutation(api.articles.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [categoryId, setCategoryId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setDescription(article.description || "");
      setContent(article.content);
      setStatus(article.status);
      setCategoryId(article.categoryId || "");
    }
  }, [article]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew && orgId) {
        await createArticle({
          organizationId: orgId,
          title,
          slug: slugify(title),
          description: description || undefined,
          content,
          status,
          categoryId: categoryId
            ? (categoryId as Id<"categories">)
            : undefined,
        });
        router.push("/helpdesk");
      } else {
        await updateArticle({
          articleId: id as Id<"articles">,
          title,
          description: description || undefined,
          content,
          status,
          categoryId: categoryId
            ? (categoryId as Id<"categories">)
            : undefined,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this article? This cannot be undone.")) {
      await deleteArticle({ articleId: id as Id<"articles"> });
      router.push("/helpdesk");
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/helpdesk"
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-[15px] font-semibold text-text-primary">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && article?.slug && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `window.OpenHelpdesk.openArticle('${article.slug}')`
                  );
                  setSnippetCopied(true);
                  setTimeout(() => setSnippetCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                {snippetCopied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Code className="h-3.5 w-3.5" />
                )}
                {snippetCopied ? "Copied!" : "JS Snippet"}
              </button>
              <a
                href={`/help/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Public URL
              </a>
            </>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              showPreview
                ? "bg-primary-50 text-primary-700"
                : "text-text-secondary hover:bg-surface-tertiary"
            )}
          >
            {showPreview ? (
              <Edit className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showPreview ? "Edit" : "Preview"}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex items-center gap-4 border-b border-border bg-surface-secondary px-6 py-2.5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-[12px] text-text-primary focus:border-primary-300 focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-[12px] text-text-primary focus:border-primary-300 focus:outline-none"
        >
          <option value="">No category</option>
          {categories?.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Editor / Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-auto", showPreview && "hidden")}>
          <div className="mx-auto max-w-3xl px-6 py-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="w-full text-2xl font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (for search/SEO)"
              className="mt-2 w-full text-[14px] text-text-secondary placeholder:text-text-tertiary focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article in markdown..."
              className="mt-6 h-[calc(100vh-280px)] w-full resize-none font-mono text-[13px] leading-relaxed text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>

        {showPreview && (
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-3xl px-6 py-6">
              <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
              {description && (
                <p className="mt-2 text-[14px] text-text-secondary">
                  {description}
                </p>
              )}
              <div className="prose prose-sm mt-6 max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {content.replace(
                    /\$\{youtube\}\[([^\]]*)\]\(([^)]+)\)/g,
                    (_m, title, id) => {
                      const videoId = id.split("?")[0];
                      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1em 0"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
                    }
                  )}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
