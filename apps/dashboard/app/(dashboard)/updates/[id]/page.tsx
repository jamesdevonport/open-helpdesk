"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Save, Trash2, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const updateTypes = [
  { value: "new_feature", label: "New Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "major_version", label: "Major Version" },
];

export default function UpdateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const update = useQuery(
    api.productUpdates.get,
    isNew ? "skip" : { updateId: id as Id<"productUpdates"> }
  );

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const createUpdate = useMutation(api.productUpdates.create);
  const updateUpdate = useMutation(api.productUpdates.update);
  const deleteUpdate = useMutation(api.productUpdates.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("new_feature");
  const [status, setStatus] = useState("draft");
  const [imageUrl, setImageUrl] = useState("");
  const [videoEmbed, setVideoEmbed] = useState("");
  const [showPreview, setShowPreview] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (update) {
      setTitle(update.title);
      setDescription(update.description);
      setType(update.type);
      setStatus(update.status);
      setImageUrl(update.imageUrl || "");
      setVideoEmbed(update.videoEmbed || "");
    }
  }, [update]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew && orgId) {
        await createUpdate({
          organizationId: orgId,
          title,
          slug: slugify(title),
          description,
          type,
          status,
          imageUrl: imageUrl || undefined,
          videoEmbed: videoEmbed || undefined,
        });
        router.push("/updates");
      } else {
        await updateUpdate({
          updateId: id as Id<"productUpdates">,
          title,
          description,
          type,
          status,
          imageUrl: imageUrl || undefined,
          videoEmbed: videoEmbed || undefined,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this update? This cannot be undone.")) {
      await deleteUpdate({ updateId: id as Id<"productUpdates"> });
      router.push("/updates");
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/updates"
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-[15px] font-semibold text-text-primary">
            {isNew ? "New Update" : "Edit Update"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
            disabled={saving || !title.trim() || !description.trim()}
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-[12px] text-text-primary focus:border-primary-300 focus:outline-none"
        >
          {updateTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Editor / Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-auto", showPreview && "hidden")}>
          <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Update title"
              className="w-full text-2xl font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the update description in markdown..."
              className="w-full h-[calc(100vh-400px)] resize-none font-mono text-[13px] leading-relaxed text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />

            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <label className="text-[12px] font-medium text-text-secondary">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-secondary">
                  Video Embed HTML (optional)
                </label>
                <textarea
                  value={videoEmbed}
                  onChange={(e) => setVideoEmbed(e.target.value)}
                  placeholder='<div style="position: relative; ..."><iframe src="https://www.tella.tv/..." ...></iframe></div>'
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 font-mono text-[12px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-3xl px-6 py-6">
              <div className="mb-3">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    type === "new_feature" &&
                      "bg-green-100 text-green-700",
                    type === "improvement" &&
                      "bg-blue-100 text-blue-700",
                    type === "major_version" &&
                      "bg-purple-100 text-purple-700"
                  )}
                >
                  {updateTypes.find((t) => t.value === type)?.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                {title}
              </h1>
              <div className="prose prose-sm mt-4 max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {description}
                </ReactMarkdown>
              </div>
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt=""
                    className="max-w-full rounded-lg border border-border"
                  />
                </div>
              )}
              {videoEmbed && (
                <div
                  className="mt-4"
                  dangerouslySetInnerHTML={{ __html: videoEmbed }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
