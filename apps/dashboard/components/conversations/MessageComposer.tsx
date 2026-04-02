"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Send, BookOpen, Search, X, Reply, StickyNote, ImagePlus, Loader2 } from "lucide-react";

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export function MessageComposer({
  conversationId,
  contactName,
  onSend,
  onSendArticle,
  disabled,
}: {
  conversationId?: string;
  contactName?: string;
  onSend: (body: string, attachments?: Attachment[]) => void;
  onSendArticle?: (articleId: string, title: string) => void;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");
  const [pendingImages, setPendingImages] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send typing indicator when agent is typing (throttled to once per 3s)
  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) return; // Already sent recently
    setTyping({ conversationId: conversationId as Id<"conversations"> }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  }, [conversationId, setTyping]);

  // Clear typing indicator on send or unmount
  const handleClearTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    clearTyping({ conversationId: conversationId as Id<"conversations"> }).catch(() => {});
  }, [conversationId, clearTyping]);

  // Clear typing indicator when agent leaves conversation or component unmounts
  useEffect(() => {
    return () => handleClearTyping();
  }, [handleClearTyping]);

  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const searchResults = useQuery(
    api.articles.search,
    showArticlePicker && orgId && articleSearch.length > 1
      ? { organizationId: orgId, query: articleSearch }
      : "skip"
  );

  const recentArticles = useQuery(
    api.articles.listPublished,
    showArticlePicker && orgId && articleSearch.length <= 1
      ? { organizationId: orgId }
      : "skip"
  );

  const displayedArticles = articleSearch.length > 1
    ? searchResults
    : recentArticles?.slice(0, 8);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of Array.from(files)) {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        // Upload the file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        // Get the serving URL
        const servingUrl = await fetch(
          `${uploadUrl.split("/upload")[0]}/getUrl?storageId=${storageId}`
        ).then((r) => r.json());

        // For Convex storage, construct the URL from the storageId
        newAttachments.push({
          name: file.name,
          url: storageId,
          contentType: file.type,
          size: file.size,
        });
      }
      setPendingImages((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [generateUploadUrl]);

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed && pendingImages.length === 0) return;
    handleClearTyping();
    onSend(trimmed || "", pendingImages.length > 0 ? pendingImages : undefined);
    setBody("");
    setPendingImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [body, pendingImages, onSend, handleClearTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  const handleSelectArticle = (articleId: string, title: string) => {
    onSendArticle?.(articleId, title);
    setShowArticlePicker(false);
    setArticleSearch("");
  };

  const canSend = body.trim() || pendingImages.length > 0;

  return (
    <div className="border-t border-border bg-surface">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 border-b border-border-light px-4 py-1.5">
        <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-primary-50 text-primary-700">
          <Reply className="h-3.5 w-3.5" />
          Reply
        </button>
        <button
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-text-tertiary cursor-not-allowed opacity-50"
          disabled
          title="Coming soon"
        >
          <StickyNote className="h-3.5 w-3.5" />
          Note
        </button>
      </div>

      {/* Article picker dropdown */}
      {showArticlePicker && (
        <div className="border-b border-border px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[12px] font-semibold text-text-primary">
                Share an article
              </h4>
              <button
                onClick={() => {
                  setShowArticlePicker(false);
                  setArticleSearch("");
                }}
                className="rounded p-0.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                placeholder="Search articles..."
                autoFocus
                className="w-full rounded-lg border border-border bg-surface-secondary py-1.5 pl-8 pr-3 text-[12px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {displayedArticles && displayedArticles.length > 0 ? (
                displayedArticles.map((article) => (
                  <button
                    key={article._id}
                    onClick={() =>
                      handleSelectArticle(article._id, article.title)
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-tertiary"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-text-primary">
                        {article.title}
                      </p>
                      {article.description && (
                        <p className="truncate text-[11px] text-text-tertiary">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="py-4 text-center text-[12px] text-text-tertiary">
                  {articleSearch.length > 1
                    ? "No articles found"
                    : "Loading..."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image previews */}
      {pendingImages.length > 0 && (
        <div className="border-b border-border-light px-4 py-2">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto">
            {pendingImages.map((img, i) => (
              <div key={i} className="group relative shrink-0">
                <div className="h-16 w-16 rounded-lg border border-border bg-surface-secondary overflow-hidden">
                  <ImagePreview storageId={img.url} name={img.name} />
                </div>
                <button
                  onClick={() => removePendingImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary">
                <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <button
            onClick={() => setShowArticlePicker(!showArticlePicker)}
            disabled={disabled}
            title="Share an article"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              showArticlePicker
                ? "border-primary-300 bg-primary-50 text-primary-600"
                : "border-border text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary"
            } disabled:opacity-40`}
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            title="Attach image"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-secondary disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              handleInput();
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={contactName ? `Reply to ${contactName}...` : "Type a message..."}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={disabled || !canSend}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ storageId, name }: { storageId: string; name: string }) {
  const url = useQuery(api.messages.getFileUrl, {
    storageId: storageId as Id<"_storage">,
  });

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <img src={url} alt={name} className="h-full w-full object-cover" />
  );
}
