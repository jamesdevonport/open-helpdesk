import { h } from "preact";

interface Update {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  publishedAt?: number;
}

interface UpdatesViewProps {
  color: string;
  updates: Update[];
  onSelectUpdate: (slug: string) => void;
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

export function UpdatesView({
  color,
  updates,
  onSelectUpdate,
}: UpdatesViewProps) {
  return (
    <div class="uls-updates-list">
      {updates.length === 0 ? (
        <div class="uls-empty-state">
          No updates yet
        </div>
      ) : (
        updates.map((update) => (
          <button
            key={update._id}
            class="uls-update-item"
            onClick={() => onSelectUpdate(update.slug)}
          >
            <div class="uls-update-item-header">
              <span
                class="uls-update-type-badge"
                style={{
                  backgroundColor:
                    (typeColors[update.type] || color) + "18",
                  color: typeColors[update.type] || color,
                }}
              >
                {typeLabels[update.type] || update.type}
              </span>
              <span class="uls-update-date">
                {formatDate(update.publishedAt)}
              </span>
            </div>
            <h4 class="uls-update-title">{update.title}</h4>
            <p class="uls-update-preview">{update.description}</p>
          </button>
        ))
      )}
    </div>
  );
}
