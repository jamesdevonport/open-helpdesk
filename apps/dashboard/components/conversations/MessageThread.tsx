"use client";

import { useRef, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn, formatDateLabel } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { BookOpen, ChevronDown, ExternalLink, Mail, Loader2, Check, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";

interface ArticlePreview {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
}

interface MessageAttachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

interface Message {
  _id: string;
  senderType: string;
  body: string;
  createdAt: number;
  readByContact: boolean;
  deliveredVia?: string;
  attachments?: MessageAttachment[];
  article?: ArticlePreview | null;
  agent?: { name: string; avatarUrl: string | null } | null;
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

export function MessageThread({
  messages,
  conversationId,
  contactName,
  contactAvatarUrl,
  contactHasEmail,
}: {
  messages: Message[];
  conversationId?: string;
  contactName?: string;
  contactAvatarUrl?: string;
  contactHasEmail?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  let lastDate: number | null = null;
  let lastAgentName: string | null = null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.map((msg, i) => {
          const isAgent = msg.senderType === "agent";
          const isSystem = msg.senderType === "system";

          // Date separator
          let dateSeparator: string | null = null;
          if (!lastDate || !isSameDay(lastDate, msg.createdAt)) {
            dateSeparator = formatDateLabel(msg.createdAt);
          }
          lastDate = msg.createdAt;

          // Show agent name when agent changes
          const showAgentName =
            isAgent &&
            msg.agent?.name &&
            msg.agent.name !== lastAgentName;
          if (isAgent) lastAgentName = msg.agent?.name || null;
          else lastAgentName = null;

          // Show contact name for first contact message or after agent messages
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const showContactName =
            !isAgent &&
            !isSystem &&
            (!prevMsg || prevMsg.senderType !== "contact");

          if (isSystem) {
            return (
              <div key={msg._id}>
                {dateSeparator && <DateSeparator label={dateSeparator} />}
                <div className="flex justify-center">
                  <span className="rounded-full bg-surface-tertiary px-3 py-1 text-[11px] text-text-tertiary">
                    {msg.body}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg._id}>
              {dateSeparator && <DateSeparator label={dateSeparator} />}

              {/* Agent name label */}
              {showAgentName && (
                <p className="mb-1 text-[11px] text-text-tertiary text-right px-1">
                  {msg.agent!.name}
                </p>
              )}

              {/* Contact name label */}
              {showContactName && (
                <p className="mb-1 text-[11px] text-text-tertiary px-9">
                  {contactName || "Visitor"}
                </p>
              )}

              <div
                className={cn(
                  "flex items-end gap-2",
                  isAgent ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isAgent && (
                  <Avatar
                    name={contactName}
                    avatarUrl={contactAvatarUrl}
                    size="sm"
                  />
                )}
                <div className={cn("max-w-[70%]", isAgent ? "items-end" : "items-start")}>
                  {/* Image attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={cn(
                      "mb-1 flex flex-wrap gap-1.5",
                      isAgent ? "justify-end" : "justify-start"
                    )}>
                      {msg.attachments.filter(a => a.contentType.startsWith("image/")).map((att, i) => (
                        <AttachmentImage key={i} attachment={att} />
                      ))}
                    </div>
                  )}

                  {/* Text body */}
                  {msg.body && !msg.article && (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5",
                        isAgent
                          ? "rounded-br-md bg-[#1b2a4a] text-white"
                          : "rounded-bl-md bg-surface-tertiary text-text-primary"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                        {msg.body}
                      </p>
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-[10px]",
                          isAgent
                            ? "justify-end text-white/40"
                            : "text-text-tertiary"
                        )}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isAgent && (
                          msg.readByContact ? (
                            <CheckCheck className="h-3 w-3 text-blue-300" />
                          ) : (
                            <Check className="h-3 w-3 text-white/30" />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp for image-only messages */}
                  {!msg.body && !msg.article && msg.attachments && msg.attachments.length > 0 && (
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1 text-[10px]",
                        isAgent
                          ? "justify-end text-text-tertiary"
                          : "text-text-tertiary"
                      )}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isAgent && (
                        msg.readByContact ? (
                          <CheckCheck className="h-3 w-3 text-blue-300" />
                        ) : (
                          <Check className="h-3 w-3 text-text-tertiary/50" />
                        )
                      )}
                    </div>
                  )}

                  {/* Article card */}
                  {msg.article && (
                    <ArticleCard article={msg.article} isAgent={isAgent} />
                  )}

                  {/* Send via email button */}
                  {isAgent && contactHasEmail && msg.body && msg.deliveredVia === "chat" && !msg.readByContact && conversationId && (
                    <SendViaEmailButton messageId={msg._id} conversationId={conversationId} />
                  )}
                  {isAgent && msg.deliveredVia === "both" && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-white/40 justify-end">
                      <Mail className="h-2.5 w-2.5" />
                      Sent via email
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border-light" />
      <span className="text-[11px] font-medium text-text-tertiary">
        {label}
      </span>
      <div className="h-px flex-1 bg-border-light" />
    </div>
  );
}

function processYoutube(content: string) {
  return content.replace(
    /\$\{youtube\}\[([^\]]*)\]\(([^)]+)\)/g,
    (_m, title, id) => {
      const videoId = id.split("?")[0];
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1em 0"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
    }
  );
}

function SendViaEmailButton({ messageId, conversationId }: { messageId: string; conversationId: string }) {
  const sendEmail = useAction(api.emailFallback.sendMessageAsEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSend = async () => {
    setStatus("sending");
    try {
      const result = await sendEmail({
        messageId: messageId as Id<"messages">,
        conversationId: conversationId as Id<"conversations">,
      });
      setStatus(result.success ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex items-center gap-1 mt-1 text-[10px] text-green-500 justify-end">
        <Check className="h-2.5 w-2.5" />
        Email sent
      </div>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === "sending"}
      className="flex items-center gap-1 mt-1 text-[10px] text-text-tertiary hover:text-primary-600 transition-colors justify-end disabled:opacity-50"
    >
      {status === "sending" ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <Mail className="h-2.5 w-2.5" />
      )}
      {status === "error" ? "Failed — retry?" : "Send via email"}
    </button>
  );
}

function ArticleCard({
  article,
  isAgent,
}: {
  article: ArticlePreview;
  isAgent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1.5 rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-3.5 text-left hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text-primary">
            {article.title}
          </p>
          {!expanded && article.description && (
            <p className="mt-0.5 text-[11px] text-text-tertiary line-clamp-2">
              {article.description}
            </p>
          )}
          {!expanded && (
            <p className="mt-1.5 text-[11px] font-medium text-primary-600">
              Read article
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-tertiary transition-transform mt-0.5",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && article.content && (
        <>
          <div className="border-t border-border-light px-4 py-3 max-h-[400px] overflow-y-auto">
            <div className="prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-a:text-primary-600 prose-a:no-underline prose-img:rounded-lg">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {processYoutube(article.content)}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border-light px-4 py-2.5">
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] font-medium text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Collapse
            </button>
            <Link
              href={`/helpdesk/${article._id}`}
              className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Open in editor
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function AttachmentImage({ attachment }: { attachment: MessageAttachment }) {
  const url = useQuery(api.messages.getFileUrl, {
    storageId: attachment.url as Id<"_storage">,
  });
  const [lightbox, setLightbox] = useState(false);

  if (!url) {
    return (
      <div className="h-48 w-48 animate-pulse rounded-xl bg-surface-tertiary" />
    );
  }

  return (
    <>
      <img
        src={url}
        alt={attachment.name}
        onClick={() => setLightbox(true)}
        className="max-h-64 max-w-[280px] cursor-pointer rounded-xl border border-border object-cover transition-opacity hover:opacity-90"
      />
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightbox(false)}
        >
          <img
            src={url}
            alt={attachment.name}
            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
