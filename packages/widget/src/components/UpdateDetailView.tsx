import { h } from "preact";
import { useMemo } from "preact/hooks";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface UpdateDetailViewProps {
  color: string;
  title: string;
  description: string;
  type: string;
  publishedAt?: number;
  imageUrl?: string;
  videoEmbed?: string;
  onBack: () => void;
  onClose: () => void;
}

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

function formatDate(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderDescription(text: string): string {
  const html = marked.parse(text, {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "target",
      "allowtransparency",
    ],
  });
}

export function UpdateDetailView({
  color,
  title,
  description,
  type,
  publishedAt,
  imageUrl,
  videoEmbed,
  onBack,
  onClose,
}: UpdateDetailViewProps) {
  const renderedHtml = useMemo(
    () => renderDescription(description),
    [description]
  );

  const sanitizedVideo = useMemo(() => {
    if (!videoEmbed) return "";
    return DOMPurify.sanitize(videoEmbed, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "src",
        "style",
        "allowtransparency",
      ],
    });
  }, [videoEmbed]);

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
          <h2>Updates</h2>
        </div>
        <button class="uls-header-close" onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="uls-content">
        <div class="uls-update-detail">
          <div class="uls-update-detail-meta">
            <span
              class="uls-update-type-badge"
              style={{
                backgroundColor:
                  (typeColors[type] || color) + "18",
                color: typeColors[type] || color,
              }}
            >
              {typeLabels[type] || type}
            </span>
            <span class="uls-update-date">
              {formatDate(publishedAt)}
            </span>
          </div>
          <h1 class="uls-update-detail-title">{title}</h1>

          {imageUrl && (
            <img
              class="uls-update-image"
              src={imageUrl}
              alt=""
            />
          )}

          {sanitizedVideo && (
            <div
              class="uls-update-video"
              dangerouslySetInnerHTML={{ __html: sanitizedVideo }}
            />
          )}

          <div
            class="uls-article-body"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
