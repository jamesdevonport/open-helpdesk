import { h, ComponentChildren } from "preact";
import { WidgetTab } from "../state";

interface TeamMember {
  name: string;
  avatarUrl: string | null;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  description?: string;
}

interface LauncherProps {
  color: string;
  greeting: string;
  siteUrl?: string;
  teamOnline: boolean;
  teamMembers: TeamMember[];
  articles: Article[];
  updatesEnabled: boolean;
  newUpdatesCount: number;
  activeTab: WidgetTab;
  onTabChange: (tab: WidgetTab) => void;
  onOpenChat: () => void;
  onSelectArticle: (slug: string) => void;
  onClose: () => void;
  children?: ComponentChildren;
}

interface TabMeta {
  label: string;
  title: string;
  subtitle: string;
}

const TAB_META: Record<WidgetTab, TabMeta> = {
  support: {
    label: "Support",
    title: "Support that feels personal",
    subtitle: "Start a conversation with the team and get answers fast.",
  },
  docs: {
    label: "Docs",
    title: "Find the right article",
    subtitle: "Search help guides, setup instructions, and walkthroughs.",
  },
  updates: {
    label: "Updates",
    title: "See what shipped",
    subtitle: "Catch up on the latest improvements and product launches.",
  },
};

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return null;

  if (match[1].length === 3) {
    const [r, g, b] = match[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

function hexToRgb(value: string): [number, number, number] {
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function mixHex(left: string, right: string, weight: number): string {
  const a = hexToRgb(left);
  const b = hexToRgb(right);
  return rgbToHex(
    a[0] + (b[0] - a[0]) * weight,
    a[1] + (b[1] - a[1]) * weight,
    a[2] + (b[2] - a[2]) * weight
  );
}

function withAlpha(value: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(value);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildLauncherTheme(color: string): Record<string, string> {
  const normalized = normalizeHex(color) || "#1977f2";
  const accentStrong = mixHex(normalized, "#071220", 0.4);
  const accentDeep = mixHex(normalized, "#020617", 0.65);
  const accentSoft = mixHex(normalized, "#ffffff", 0.76);

  return {
    ["--uls-accent" as any]: normalized,
    ["--uls-accent-strong" as any]: accentStrong,
    ["--uls-accent-deep" as any]: accentDeep,
    ["--uls-accent-soft" as any]: accentSoft,
    ["--uls-accent-tint" as any]: withAlpha(normalized, 0.16),
    ["--uls-accent-glow" as any]: withAlpha(normalized, 0.28),
    ["--uls-accent-ring" as any]: withAlpha(normalized, 0.22),
    ["--uls-accent-border" as any]: withAlpha(normalized, 0.24),
    ["--uls-accent-shadow" as any]: withAlpha(accentDeep, 0.28),
  };
}

function TabIcon({ tab }: { tab: WidgetTab }) {
  if (tab === "docs") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5a2.5 2.5 0 0 0-2.5-2.5H4z" />
        <path d="M4 5.5v13A2.5 2.5 0 0 0 6.5 21H20" />
        <path d="M8 7.5h7" />
        <path d="M8 11h8" />
      </svg>
    );
  }

  if (tab === "updates") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v10" />
        <path d="m8.5 9.5 3.5 3.5 3.5-3.5" />
        <path d="M5 15.5h14" />
        <path d="M7 19h10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5z" />
    </svg>
  );
}

const INITIALS_COLORS = [
  "#1d4ed8",
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#0369a1",
];

function TeamAvatar({ member, index }: { member: TeamMember; index: number }) {
  const bgColor = INITIALS_COLORS[index % INITIALS_COLORS.length];

  return (
    <div class="uls-launcher-avatar" title={member.name}>
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgColor,
            color: "#fff",
            fontSize: "18px",
            fontWeight: "700",
          }}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function PanelIntro({
  activeTab,
  greeting,
  teamOnline,
  teamMembers,
  onOpenChat,
}: {
  activeTab: WidgetTab;
  greeting: string;
  teamOnline: boolean;
  teamMembers: TeamMember[];
  onOpenChat: () => void;
}) {
  if (activeTab === "support") {
    return (
      <div class="uls-launcher-hero-main">
        {teamMembers.length > 0 && (
          <div class="uls-launcher-avatars" aria-label="Support team">
            {teamMembers.map((member, i) => (
              <TeamAvatar key={member.name} member={member} index={i} />
            ))}
          </div>
        )}

        <div class="uls-launcher-copy">
          <h2>{greeting}</h2>
          <div class="uls-launcher-status">
            <span
              class="uls-status-dot"
              style={{
                backgroundColor: teamOnline ? "#22c55e" : "rgba(255,255,255,0.58)",
              }}
            />
            <span>
              {teamOnline ? "We're online and ready to help" : "Leave a note and we'll reply soon"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const meta = TAB_META[activeTab];

  return (
    <div class="uls-launcher-hero-compact-copy">
      <div class="uls-launcher-compact-icon">
        <TabIcon tab={activeTab} />
      </div>
      <div>
        <h2>{meta.title}</h2>
        <p>{meta.subtitle}</p>
      </div>
    </div>
  );
}

export function Launcher({
  color,
  greeting,
  siteUrl,
  teamOnline,
  teamMembers,
  articles,
  updatesEnabled,
  newUpdatesCount,
  activeTab,
  onTabChange,
  onOpenChat,
  onSelectArticle,
  onClose,
  children,
}: LauncherProps) {
  const tabs: { id: WidgetTab; label: string }[] = [
    { id: "support", label: TAB_META.support.label },
    { id: "docs", label: TAB_META.docs.label },
  ];

  if (updatesEnabled) {
    tabs.push({ id: "updates", label: TAB_META.updates.label });
  }

  const launcherTheme = buildLauncherTheme(color);
  const helpCenterUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/help`
    : null;

  return (
    <div class="uls-panel uls-panel-expanded uls-panel-launcher" style={launcherTheme as any}>
      <div class={`uls-launcher-hero ${activeTab === "support" ? "" : "uls-launcher-hero-compact"}`}>
        <div class="uls-launcher-hero-pattern" aria-hidden="true" />

        <div class="uls-launcher-topbar">
          <div class="uls-launcher-tabs" role="tablist" aria-label="Widget sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                class={`uls-launcher-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span class="uls-launcher-tab-icon">
                  <TabIcon tab={tab.id} />
                </span>
                <span>{tab.label}</span>
                {tab.id === "updates" && newUpdatesCount > 0 && (
                  <span class="uls-launcher-tab-badge" />
                )}
              </button>
            ))}
          </div>

          <button class="uls-launcher-close" onClick={onClose} aria-label="Close widget">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <PanelIntro
          activeTab={activeTab}
          greeting={greeting}
          teamOnline={teamOnline}
          teamMembers={teamMembers}
          onOpenChat={onOpenChat}
        />
      </div>

      {activeTab === "support" ? (
        <div class="uls-launcher-panel uls-launcher-panel-support">
          <div class="uls-content">
            <div class="uls-launcher-support-body">
              <button class="uls-launcher-cta" onClick={onOpenChat}>
                <span class="uls-launcher-cta-icon">
                  <TabIcon tab="support" />
                </span>
                <span>Send us a message</span>
              </button>

              {articles.length > 0 && (
                <div class="uls-launcher-popular-articles">
                  <h3 class="uls-launcher-section-label">Popular articles</h3>
                  {articles.slice(0, 4).map((article) => (
                    <button
                      key={article._id}
                      class="uls-launcher-article-link"
                      onClick={() => onSelectArticle(article.slug)}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5a2.5 2.5 0 0 0-2.5-2.5H4z" />
                        <path d="M4 5.5v13A2.5 2.5 0 0 0 6.5 21H20" />
                      </svg>
                      <span>{article.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div class={`uls-launcher-panel uls-launcher-panel-${activeTab}`}>{children}</div>
      )}

      {helpCenterUrl && (
        <div class="uls-powered">
          <a href={helpCenterUrl} target="_blank" rel="noopener">
            Open full help center
          </a>
        </div>
      )}
    </div>
  );
}
