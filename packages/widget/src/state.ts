export type WidgetView =
  | "closed"
  | "launcher"
  | "chat"
  | "helpdesk"
  | "article"
  | "updates"
  | "updateDetail";

export type WidgetTab = "support" | "docs" | "updates";

export interface WidgetUser {
  email?: string;
  externalId?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface WidgetState {
  view: WidgetView;
  isOpen: boolean;
  organizationId: string;
  convexUrl: string;
  siteUrl: string;
  user: WidgetUser | null;
  contactId: string | null;
  conversationId: string | null;
  currentArticleSlug: string | null;
  currentUpdateSlug: string | null;
  activeTab: WidgetTab;
  updatesEnabled: boolean;
  lastSeenUpdatesAt: number | null;
  unreadCount: number;
  lastSeenMessageId: string | null;
  color: string;
  greeting: string;
  position: string;
}

type Listener = (state: WidgetState) => void;

const listeners: Set<Listener> = new Set();
const STORAGE_KEY = "open_helpdesk_session";

// Fields we persist to localStorage
interface PersistedSession {
  contactId: string | null;
  conversationId: string | null;
  lastSeenMessageId: string | null;
  lastSeenUpdatesAt: number | null;
  userKey: string | null;
}

function loadSession(): PersistedSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        contactId: parsed.contactId || null,
        conversationId: parsed.conversationId || null,
        lastSeenMessageId: parsed.lastSeenMessageId || null,
        lastSeenUpdatesAt: parsed.lastSeenUpdatesAt || null,
        userKey: parsed.userKey || null,
      };
    }
  } catch {}
  return { contactId: null, conversationId: null, lastSeenMessageId: null, lastSeenUpdatesAt: null, userKey: null };
}

export function getUserKey(user: WidgetUser | null): string | null {
  return userKey(user);
}

function userKey(user: WidgetUser | null): string | null {
  if (!user) return null;
  return user.email || user.externalId || null;
}

function saveSession(state: WidgetState) {
  try {
    const session: PersistedSession = {
      contactId: state.contactId,
      conversationId: state.conversationId,
      lastSeenMessageId: state.lastSeenMessageId,
      lastSeenUpdatesAt: state.lastSeenUpdatesAt,
      userKey: userKey(state.user),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

const session = loadSession();

export function getSessionUserKey(): string | null {
  return session.userKey;
}

let state: WidgetState = {
  view: "closed",
  isOpen: false,
  organizationId: "",
  convexUrl: "",
  siteUrl: "",
  user: null,
  contactId: session.contactId,
  conversationId: session.conversationId,
  currentArticleSlug: null,
  currentUpdateSlug: null,
  activeTab: "support",
  updatesEnabled: false,
  lastSeenUpdatesAt: session.lastSeenUpdatesAt,
  unreadCount: 0,
  lastSeenMessageId: session.lastSeenMessageId,
  color: "#1977f2",
  greeting: "Hi! How can we help?",
  position: "bottom-right",
};

export function getState(): WidgetState {
  return state;
}

export function setState(partial: Partial<WidgetState>) {
  state = { ...state, ...partial };

  // Persist session-related fields when they change
  if (
    "contactId" in partial ||
    "conversationId" in partial ||
    "lastSeenMessageId" in partial ||
    "lastSeenUpdatesAt" in partial ||
    "user" in partial
  ) {
    saveSession(state);
  }

  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
