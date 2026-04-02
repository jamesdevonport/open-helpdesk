import { h } from "preact";
import { useState, useRef, useEffect, useMemo } from "preact/hooks";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { WidgetMessage, WidgetMessageArticle, WidgetMessageAttachment, PendingAttachment, uploadFile } from "../convex";

interface ChatViewProps {
  color: string;
  siteUrl?: string;
  messages: WidgetMessage[];
  typingAgent: string | null;
  showEmailPrompt: boolean;
  onSend: (body: string, attachments?: Array<{ name: string; url: string; contentType: string; size: number; localPreviewUrl?: string }>) => void;
  onIdentify: (email: string, name: string) => void;
  onOpenArticle?: (slug: string) => void;
  onBack: () => void;
  onClose: () => void;
}

function isSameDay(a: number, b: number): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateSeparator(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(ts, now.getTime())) return "Today";
  if (isSameDay(ts, yesterday.getTime())) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ChatView({
  color,
  siteUrl,
  messages,
  typingAgent,
  showEmailPrompt,
  onSend,
  onIdentify,
  onBack,
  onClose,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailSkipped, setEmailSkipped] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingAgent]);

  // Focus the textarea when chat view opens
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach(img => URL.revokeObjectURL(img.localPreviewUrl));
    };
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE
    );
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of validFiles) {
        const attachment = await uploadFile(file);
        if (attachment) {
          setPendingImages(prev => [...prev, attachment]);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      processFiles(input.files);
      input.value = "";
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => {
      const removed = prev[index];
      if (removed?.localPreviewUrl) URL.revokeObjectURL(removed.localPreviewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types.includes("Files")) setDragOver(true);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && pendingImages.length === 0) return;
    const attachments = pendingImages.length > 0 ? pendingImages : undefined;
    onSend(trimmed, attachments);
    setInput("");
    setPendingImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmailSubmit = () => {
    const email = emailInput.trim();
    if (!email) return;
    onIdentify(email, "");
    setEmailSubmitted(true);
  };

  // Whether to show the email prompt banner
  const shouldShowBanner =
    showEmailPrompt && !emailSubmitted && messages.length > 0;

  // Track last agent for grouping and last date for separators
  let lastAgentId: string | null = null;
  let lastDate: number | null = null;

  return (
    <div class="uls-panel">
      <div class="uls-header" style={{ backgroundColor: color }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button class="uls-back" onClick={onBack}>
            <svg viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>Messages</h2>
        </div>
        <button class="uls-header-close" onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div
        class={`uls-content ${dragOver ? "uls-drag-over" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div class="uls-drop-overlay">
            <div class="uls-drop-label">Drop images here</div>
          </div>
        )}
        <div class="uls-messages">
          {messages.length === 0 && (
            <div class="uls-message-system">
              How can we help?
            </div>
          )}
          {messages.map((msg, i) => {
            const isAgent = msg.senderType === "agent";
            const isSystem = msg.senderType === "system";
            const nextMsg = messages[i + 1];
            const isLastInGroup =
              !nextMsg || nextMsg.senderType !== msg.senderType;

            // Date separator
            let dateSeparator: string | null = null;
            if (!lastDate || !isSameDay(lastDate, msg.createdAt)) {
              dateSeparator = formatDateSeparator(msg.createdAt);
            }
            lastDate = msg.createdAt;

            // Show agent avatar for first message in an agent group
            const showAgentAvatar =
              isAgent &&
              msg.agent?.name &&
              (msg.agent.name !== lastAgentId ||
                (i > 0 && messages[i - 1]?.senderType !== "agent"));

            if (isAgent) {
              lastAgentId = msg.agent?.name || null;
            } else {
              lastAgentId = null;
            }

            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={msg.id}>
                {dateSeparator && (
                  <div class="uls-date-separator">
                    <span>{dateSeparator}</span>
                  </div>
                )}

                {/* Agent avatar + name */}
                {showAgentAvatar && (
                  <div class="uls-agent-label">
                    {msg.agent!.avatarUrl ? (
                      <img
                        src={msg.agent!.avatarUrl}
                        class="uls-agent-avatar"
                        alt={msg.agent!.name}
                      />
                    ) : (
                      <div
                        class="uls-agent-avatar-placeholder"
                        style={{ backgroundColor: color }}
                      >
                        {msg.agent!.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{msg.agent!.name}</span>
                  </div>
                )}

                {/* System message */}
                {isSystem && (
                  <div class="uls-message-system">{msg.body}</div>
                )}

                {/* Image attachments */}
                {msg.attachments && msg.attachments.length > 0 && !isSystem && (
                  <div class={`uls-msg-row ${isAgent ? "uls-msg-row-agent" : "uls-msg-row-contact"}`}>
                    <div class="uls-msg-images">
                      {msg.attachments.filter(a => a.contentType.startsWith("image/")).map((att, i) => (
                        <img
                          key={i}
                          src={att.url}
                          alt={att.name}
                          class="uls-msg-image"
                          onClick={() => window.open(att.url, "_blank")}
                        />
                      ))}
                    </div>
                    {!msg.body && isLastInGroup && (
                      <span class="uls-msg-time">{time}</span>
                    )}
                  </div>
                )}

                {/* Text bubble */}
                {msg.body && !msg.article && !isSystem && (
                  <div
                    class={`uls-msg-row ${isAgent ? "uls-msg-row-agent" : "uls-msg-row-contact"}`}
                  >
                    <div
                      class={`uls-msg-bubble ${isAgent ? "uls-msg-agent" : "uls-msg-contact"}`}
                      style={isAgent ? { backgroundColor: color } : undefined}
                    >
                      {msg.body}
                    </div>
                    {isLastInGroup && (
                      <span class="uls-msg-time">{time}</span>
                    )}
                  </div>
                )}

                {/* Article card */}
                {msg.article && (
                  <ArticleCard
                    article={msg.article}
                    color={color}
                    siteUrl={siteUrl}
                    isAgent={isAgent}
                    timestamp={msg.createdAt}
                  />
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingAgent && (
            <div class="uls-typing">
              <div class="uls-typing-dots">
                <span style={{ backgroundColor: color }} />
                <span style={{ backgroundColor: color }} />
                <span style={{ backgroundColor: color }} />
              </div>
              <span class="uls-typing-name">{typingAgent} is typing</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Email collection card — Crisp style */}
      {shouldShowBanner && !emailSkipped && (
        <div class="uls-email-card">
          <h3 class="uls-email-card-title">Get notified when we reply</h3>
          <p class="uls-email-card-desc">We'll send you an email when there's a new message.</p>
          <input
            type="email"
            value={emailInput}
            onInput={(e) => setEmailInput((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEmailSubmit();
            }}
            placeholder="Enter your email address..."
            class="uls-email-card-input"
          />
          <div class="uls-email-card-actions">
            <button
              onClick={handleEmailSubmit}
              disabled={!emailInput.trim()}
              class="uls-email-card-submit"
              style={{ backgroundColor: color }}
            >
              Set my email
            </button>
            <button
              onClick={() => setEmailSkipped(true)}
              class="uls-email-card-skip"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Pending image previews */}
      {(pendingImages.length > 0 || uploading) && (
        <div class="uls-pending-images">
          {pendingImages.map((img, i) => (
            <div key={i} class="uls-pending-thumb">
              <img src={img.localPreviewUrl} alt={img.name} />
              <button class="uls-pending-remove" onClick={() => removePendingImage(i)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          {uploading && (
            <div class="uls-pending-thumb uls-pending-loading">
              <div class="uls-upload-spinner" />
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <div class="uls-composer">
        <button
          class="uls-composer-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image"
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <textarea
          ref={textareaRef}
          value={input}
          onInput={(e) => {
            setInput((e.target as HTMLTextAreaElement).value);
            const el = e.target as HTMLTextAreaElement;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() && pendingImages.length === 0}
          style={{ backgroundColor: color }}
        >
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  color,
  siteUrl,
  isAgent,
  timestamp,
}: {
  article: WidgetMessageArticle;
  color: string;
  siteUrl?: string;
  isAgent: boolean;
  timestamp: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const fullArticleUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/help/${article.slug}`
    : null;

  const renderedHtml = useMemo(() => {
    if (!article.content) return "";
    const processed = article.content.replace(
      /\$\{youtube\}\[([^\]]*)\]\(([^)]+)\)/g,
      (_, title, id) => {
        const videoId = id.split("?")[0];
        return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:0.75em 0"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
      }
    );
    const html = marked.parse(processed, { async: false, gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
    });
  }, [article.content]);

  return (
    <div class={`uls-msg-row ${isAgent ? "uls-msg-row-agent" : "uls-msg-row-contact"}`}>
      <div class="uls-article-inline">
        <div class="uls-article-inline-card" onClick={() => setExpanded(!expanded)}>
          <div class="uls-article-inline-header">
            <div class="uls-article-inline-icon" style={{ backgroundColor: color + "18", color: color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div class="uls-article-inline-meta">
              <div class="uls-article-inline-title">{article.title}</div>
              {!expanded && article.description && (
                <div class="uls-article-inline-desc">{article.description}</div>
              )}
            </div>
            <div class="uls-article-inline-toggle" style={{ color: color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" width="16" height="16"
                style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          {!expanded && (
            <div class="uls-article-inline-cta" style={{ color: color }}>Read article</div>
          )}
        </div>
        {expanded && renderedHtml && (
          <div class="uls-article-inline-body">
            <div class="uls-article-inline-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            <div class="uls-article-inline-footer">
              <button class="uls-article-inline-collapse" onClick={(e) => { e.stopPropagation(); setExpanded(false); }} style={{ color: color }}>
                Collapse
              </button>
              {fullArticleUrl && (
                <a href={fullArticleUrl} target="_blank" rel="noopener noreferrer" class="uls-article-inline-link" style={{ color: color }} onClick={(e) => e.stopPropagation()}>
                  Open full article
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <span class="uls-msg-time">
        {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
