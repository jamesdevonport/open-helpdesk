import { h, render } from "preact";
import { App } from "./components/App";
import { api } from "./api";
import { getState, setState, clearSession, getUserKey, getSessionUserKey } from "./state";
import { countNewUpdates, fetchWidgetConfig } from "./convex";
import cssText from "./styles/widget.css?inline";

declare global {
  interface Window {
    OpenHelpdesk: typeof api & {
      organizationId?: string;
      convexUrl?: string;
      siteUrl?: string;
      color?: string;
      greeting?: string;
      position?: string;
      user?: {
        email?: string;
        externalId?: string;
        name?: string;
        metadata?: Record<string, unknown>;
      };
    };
  }
}

function init() {
  // Read config from window.OpenHelpdesk
  const config = window.OpenHelpdesk || {};
  const organizationId = config.organizationId || "";
  const convexUrl = config.convexUrl || "";
  const siteUrl = config.siteUrl || "";

  // The config user is the source of truth. If the persisted session's
  // userKey doesn't match (or is missing), clear stale session data so
  // the current user gets a fresh conversation.
  const currentSession = getState();
  const newUser = config.user || null;
  const newKey = getUserKey(newUser);
  const storedKey = getSessionUserKey();
  const sessionStale =
    currentSession.contactId && newKey !== storedKey;

  if (sessionStale) {
    setState({
      organizationId,
      convexUrl,
      siteUrl,
      user: newUser,
      contactId: null,
      conversationId: null,
      lastSeenMessageId: null,
      unreadCount: 0,
      color: config.color || "#1977f2",
      greeting: config.greeting || "Hi! How can we help?",
      position: config.position || "bottom-right",
    });
    clearSession();
  } else {
    setState({
      organizationId,
      convexUrl,
      siteUrl,
      user: newUser,
      color: config.color || "#1977f2",
      greeting: config.greeting || "Hi! How can we help?",
      position: config.position || "bottom-right",
    });
  }

  // Create Shadow DOM container
  const host = document.createElement("div");
  host.id = "open-helpdesk-widget";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = cssText;
  shadow.appendChild(style);

  // Mount Preact app
  const container = document.createElement("div");
  shadow.appendChild(container);
  render(h(App, null), container);

  // Expose public API
  window.OpenHelpdesk = Object.assign(config, api);

  // Setup updates indicator badges
  setupUpdatesIndicator();
}

function setupUpdatesIndicator() {
  const accentColor = getState().color || "#2563eb";
  const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

  // Sparkle SVG icon used across variants
  const sparkleSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>`;

  // Inject indicator CSS
  const indicatorStyle = document.createElement("style");
  indicatorStyle.textContent = `
    @keyframes uls-ind-pulse {
      0% { box-shadow: 0 0 0 0 ${accentColor}50; }
      70% { box-shadow: 0 0 0 6px ${accentColor}00; }
      100% { box-shadow: 0 0 0 0 ${accentColor}00; }
    }
    @keyframes uls-ind-pop {
      0% { opacity: 0; transform: scale(0); }
      60% { transform: scale(1.15); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* ── Dot variant ── */
    .uls-ind-dot-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      font-family: ${font};
      padding: 0;
      line-height: 1;
    }
    .uls-ind-dot-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: ${accentColor};
    }
    .uls-ind-dot-btn svg {
      width: 18px;
      height: 18px;
    }
    .uls-ind-dot-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${accentColor};
      border: 2px solid white;
      opacity: 0;
      transform: scale(0);
      pointer-events: none;
    }
    .uls-ind-dot-badge.uls-ind-show {
      animation: uls-ind-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                 uls-ind-pulse 1.5s ease-out 0.4s 2;
    }

    /* ── Pill variant ── */
    .uls-ind-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
      font-family: ${font};
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      line-height: 1.4;
      white-space: nowrap;
    }
    .uls-ind-pill-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
    .uls-ind-pill-btn svg {
      width: 15px;
      height: 15px;
      color: ${accentColor};
      flex-shrink: 0;
    }
    .uls-ind-pill-count {
      display: none;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      border-radius: 10px;
      background: ${accentColor}14;
      color: ${accentColor};
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      white-space: nowrap;
    }
    .uls-ind-pill-count.uls-ind-show {
      display: inline-flex;
    }
    .uls-ind-pill-count-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${accentColor};
      flex-shrink: 0;
    }

    /* ── Badge variant ── */
    .uls-ind-badge-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      font-family: ${font};
      padding: 0;
      line-height: 1;
    }
    .uls-ind-badge-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: ${accentColor};
    }
    .uls-ind-badge-btn svg {
      width: 18px;
      height: 18px;
    }
    .uls-ind-badge-count {
      position: absolute;
      top: -7px;
      right: -7px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: ${accentColor};
      color: white;
      font-family: ${font};
      font-size: 10px;
      font-weight: 700;
      line-height: 18px;
      text-align: center;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      pointer-events: none;
      opacity: 0;
      transform: scale(0);
    }
    .uls-ind-badge-count.uls-ind-show {
      animation: uls-ind-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    /* ── Text variant ── */
    .uls-ind-text-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 10px;
      border: none;
      background: ${accentColor};
      color: white;
      font-family: ${font};
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
      line-height: 1.4;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
    }
    .uls-ind-text-btn:hover {
      opacity: 0.9;
    }
    .uls-ind-text-btn svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }
    .uls-ind-text-count {
      display: none;
      padding: 1px 7px;
      border-radius: 8px;
      background: rgba(255,255,255,0.25);
      font-size: 11px;
      font-weight: 600;
      line-height: 16px;
    }
    .uls-ind-text-count.uls-ind-show {
      display: inline-block;
    }
  `;
  document.head.appendChild(indicatorStyle);

  // Render a fully styled component inside each placeholder
  function renderIndicators() {
    document.querySelectorAll<HTMLElement>("[data-open-helpdesk-updates]").forEach((el) => {
      if (el.dataset.ulsRendered) return;
      el.dataset.ulsRendered = "1";

      const variant = (el.getAttribute("data-open-helpdesk-updates") || "pill").toLowerCase();

      let btn: HTMLButtonElement;

      if (variant === "dot") {
        btn = document.createElement("button");
        btn.className = "uls-ind-dot-btn";
        btn.innerHTML = `${sparkleSvg}<span class="uls-ind-dot-badge"></span>`;
        btn.title = "What's New";
      } else if (variant === "badge") {
        btn = document.createElement("button");
        btn.className = "uls-ind-badge-btn";
        btn.innerHTML = `${sparkleSvg}<span class="uls-ind-badge-count"></span>`;
        btn.title = "What's New";
      } else if (variant === "text") {
        btn = document.createElement("button");
        btn.className = "uls-ind-text-btn";
        btn.innerHTML = `${sparkleSvg} What's New <span class="uls-ind-text-count"></span>`;
      } else {
        // pill (default)
        btn = document.createElement("button");
        btn.className = "uls-ind-pill-btn";
        btn.innerHTML = `${sparkleSvg} What's New <span class="uls-ind-pill-count"><span class="uls-ind-pill-count-dot"></span><span class="uls-ind-pill-count-text"></span></span>`;
      }

      btn.addEventListener("click", () => {
        if (window.OpenHelpdesk?.openUpdates) {
          window.OpenHelpdesk.openUpdates();
        }
      });

      el.appendChild(btn);
    });
  }

  // Update all rendered indicators with current count
  function updateIndicators(count: number) {
    // Dot badges
    document.querySelectorAll(".uls-ind-dot-badge").forEach((el) => {
      el.classList.toggle("uls-ind-show", count > 0);
    });

    // Badge counts
    document.querySelectorAll(".uls-ind-badge-count").forEach((el) => {
      el.textContent = count > 9 ? "9+" : String(count);
      el.classList.toggle("uls-ind-show", count > 0);
    });

    // Pill counts
    document.querySelectorAll(".uls-ind-pill-count").forEach((el) => {
      const textEl = el.querySelector(".uls-ind-pill-count-text");
      if (textEl) textEl.textContent = count === 1 ? "1 new" : `${count > 9 ? "9+" : count} new`;
      el.classList.toggle("uls-ind-show", count > 0);
    });

    // Text counts
    document.querySelectorAll(".uls-ind-text-count").forEach((el) => {
      el.textContent = count > 9 ? "9+" : String(count);
      el.classList.toggle("uls-ind-show", count > 0);
    });
  }

  async function refreshIndicators() {
    const s = getState();
    if (!s.updatesEnabled) return;
    const since = s.lastSeenUpdatesAt || 0;
    const count = await countNewUpdates(since);
    updateIndicators(count);
  }

  // Initial render
  renderIndicators();

  // Wait for widget config, then start polling
  fetchWidgetConfig().then((config) => {
    if (config?.updatesEnabled) {
      refreshIndicators();
      setInterval(() => {
        renderIndicators();
        refreshIndicators();
      }, 60_000);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
