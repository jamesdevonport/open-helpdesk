import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface ArticleViewProps {
  color: string;
  title: string;
  description?: string;
  content: string;
  onBack: () => void;
  onClose: () => void;
  onOpenChat: () => void;
  onFeedback?: (helpful: boolean) => void;
}

function processContent(content: string): string {
  // Pre-process YouTube embeds before markdown parsing
  const processed = content.replace(
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
}

export function ArticleView({
  color,
  title,
  description,
  content,
  onBack,
  onClose,
  onOpenChat,
  onFeedback,
}: ArticleViewProps) {
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const renderedHtml = useMemo(() => processContent(content), [content]);

  const handleFeedback = (helpful: boolean) => {
    setFeedback(helpful);
    onFeedback?.(helpful);
  };

  return (
    <div class="uls-panel uls-panel-expanded">
      <div class="uls-header" style={{ backgroundColor: color }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button class="uls-back" onClick={onBack}>
            <svg viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>Help Center</h2>
        </div>
        <button class="uls-header-close" onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="uls-content">
        <div class="uls-article-view">
          <h1>{title}</h1>
          {description && <div class="uls-article-desc">{description}</div>}
          <div
            class="uls-article-body"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* Feedback */}
          <div class="uls-feedback">
            {feedback === null ? (
              <>
                <p>Was this article helpful?</p>
                <div class="uls-feedback-buttons">
                  <button
                    class="uls-feedback-btn"
                    onClick={() => handleFeedback(true)}
                  >
                    Yes
                  </button>
                  <button
                    class="uls-feedback-btn"
                    onClick={() => handleFeedback(false)}
                  >
                    No
                  </button>
                </div>
              </>
            ) : (
              <p>
                {feedback
                  ? "Thanks for letting us know!"
                  : "Thanks for your feedback."}
              </p>
            )}
          </div>

          {/* CTA */}
          <div class="uls-cta">
            <p>Still need help?</p>
            <button onClick={onOpenChat} style={{ backgroundColor: color }}>
              Send us a message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
