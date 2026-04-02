import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { getState, setState } from "./state";

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  const { convexUrl } = getState();
  if (!convexUrl) return null;
  if (!client) {
    client = new ConvexHttpClient(convexUrl);
  }
  return client;
}

function logError(context: string, err: unknown) {
  console.error(`[Open Helpdesk Widget] ${context}:`, err);
}

// --- Team Members ---

export interface WidgetTeamMember {
  name: string;
  avatarUrl: string | null;
}

export async function fetchTeamMembers(): Promise<WidgetTeamMember[]> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return [];
  try {
    return await c.query(api.agents.listForWidget, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("fetchTeamMembers", err);
    return [];
  }
}

// --- Articles ---

export interface WidgetArticle {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  content: string;
}

export interface WidgetCategory {
  _id: string;
  name: string;
  slug: string;
}

export async function fetchArticles(): Promise<WidgetArticle[]> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return [];
  try {
    return await c.query(api.articles.listPublished, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("fetchArticles", err);
    return [];
  }
}

export async function fetchCategories(): Promise<WidgetCategory[]> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return [];
  try {
    return await c.query(api.categories.list, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("fetchCategories", err);
    return [];
  }
}

export async function searchArticles(
  query: string
): Promise<WidgetArticle[]> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return [];
  try {
    return await c.query(api.articles.search, {
      organizationId: organizationId as any,
      query,
    });
  } catch (err) {
    logError("searchArticles", err);
    return [];
  }
}

export async function recordView(articleId: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.mutation(api.articles.recordView, { articleId: articleId as any });
  } catch (err) {
    logError("recordView", err);
  }
}

export async function recordFeedback(
  articleId: string,
  helpful: boolean
): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.mutation(api.articles.recordFeedback, {
      articleId: articleId as any,
      helpful,
    });
  } catch (err) {
    logError("recordFeedback", err);
  }
}

// --- Product Updates ---

export interface WidgetUpdate {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  imageUrl?: string;
  videoEmbed?: string;
  publishedAt?: number;
}

export async function fetchUpdates(): Promise<WidgetUpdate[]> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return [];
  try {
    return await c.query(api.productUpdates.listPublished, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("fetchUpdates", err);
    return [];
  }
}

export async function fetchUpdateBySlug(
  slug: string
): Promise<WidgetUpdate | null> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return null;
  try {
    return await c.query(api.productUpdates.getBySlug, {
      organizationId: organizationId as any,
      slug,
    });
  } catch (err) {
    logError("fetchUpdateBySlug", err);
    return null;
  }
}

export async function countNewUpdates(since: number): Promise<number> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return 0;
  try {
    return await c.query(api.productUpdates.countNewSince, {
      organizationId: organizationId as any,
      since,
    });
  } catch (err) {
    logError("countNewUpdates", err);
    return 0;
  }
}

export async function fetchWidgetConfig(): Promise<{
  updatesEnabled: boolean;
  chatInactivityTimeoutMinutes: number;
} | null> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return null;
  try {
    return await c.query(api.organizations.getWidgetConfig, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("fetchWidgetConfig", err);
    return null;
  }
}

// --- Staleness check ---

/** Check if stored conversation is stale and clear it if so. Returns true if cleared. */
export async function checkAndClearStaleConversation(
  timeoutMinutes?: number
): Promise<boolean> {
  const c = getClient();
  const { conversationId } = getState();
  if (!c || !conversationId) return false;

  try {
    const result = await c.query(api.conversations.getStatus, {
      conversationId: conversationId as any,
    });

    // Conversation deleted or already resolved/closed
    if (
      !result ||
      result.status === "closed" ||
      result.status === "resolved"
    ) {
      setState({ conversationId: null, lastSeenMessageId: null, unreadCount: 0 });
      return true;
    }

    // Check inactivity timeout
    const timeoutMs = (timeoutMinutes ?? 240) * 60 * 1000;
    if (Date.now() - result.lastMessageAt > timeoutMs) {
      await c.mutation(api.conversations.autoResolve, {
        conversationId: conversationId as any,
      });
      setState({ conversationId: null, lastSeenMessageId: null, unreadCount: 0 });
      return true;
    }

    return false;
  } catch (err) {
    logError("checkAndClearStaleConversation", err);
    return false;
  }
}

// --- Chat ---

export interface WidgetMessageArticle {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
}

export interface WidgetMessageAgent {
  name: string;
  avatarUrl: string | null;
}

export interface WidgetMessageAttachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface PendingAttachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
  localPreviewUrl: string;
}

export interface WidgetMessage {
  id: string;
  senderType: string;
  body: string;
  createdAt: number;
  attachments?: WidgetMessageAttachment[];
  article?: WidgetMessageArticle | null;
  agent?: WidgetMessageAgent | null;
}

// Cache geo data so we only fetch once per session
let geoCache: { country?: string; countryCode?: string; city?: string } | null = null;

async function fetchGeoInfo(): Promise<{ country?: string; countryCode?: string; city?: string }> {
  if (geoCache) return geoCache;
  try {
    const res = await fetch("https://ip-api.io/json", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      geoCache = {
        country: data.country_name || undefined,
        countryCode: data.country_code || undefined,
        city: data.city || undefined,
      };
      return geoCache;
    }
  } catch {}
  geoCache = {};
  return geoCache;
}

/** Ensure a contact exists for this widget user, returns contactId */
export async function ensureContact(): Promise<string | null> {
  const c = getClient();
  const { organizationId, user, contactId } = getState();
  if (!c || !organizationId) return null;

  // Fetch geo info only for new contacts
  const geo = contactId ? {} : await fetchGeoInfo();

  try {
    const id = await c.mutation(api.contacts.getOrCreate, {
      organizationId: organizationId as any,
      email: user?.email,
      name: user?.name,
      externalId: user?.externalId,
      metadata: user?.metadata,
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        currentUrl: window.location.href,
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
      },
    });
    setState({ contactId: id });
    return id;
  } catch (err) {
    logError("ensureContact", err);
    return contactId;
  }
}

/** Create a new conversation, returns conversationId */
export async function createConversation(): Promise<string | null> {
  const c = getClient();
  const { organizationId, conversationId } = getState();
  if (!c || !organizationId) return null;
  if (conversationId) return conversationId;

  const contactId = await ensureContact();
  if (!contactId) return null;

  try {
    const id = await c.mutation(api.conversations.create, {
      organizationId: organizationId as any,
      contactId: contactId as any,
      channel: "chat",
    });
    setState({ conversationId: id });
    return id;
  } catch (err) {
    logError("createConversation", err);
    return null;
  }
}

/** Generate an upload URL for widget visitors */
async function generateWidgetUploadUrl(): Promise<string | null> {
  const c = getClient();
  const { conversationId } = getState();
  if (!c || !conversationId) return null;
  try {
    return await c.mutation(api.messages.generateWidgetUploadUrl, {
      conversationId: conversationId as any,
    });
  } catch (err) {
    logError("generateWidgetUploadUrl", err);
    return null;
  }
}

/** Upload a file to Convex storage and return attachment metadata */
export async function uploadFile(file: File): Promise<PendingAttachment | null> {
  // Ensure conversation exists before uploading
  let convId = getState().conversationId;
  if (!convId) {
    convId = await createConversation();
  }
  if (!convId) return null;

  const uploadUrl = await generateWidgetUploadUrl();
  if (!uploadUrl) return null;

  try {
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();

    return {
      name: file.name,
      url: storageId,
      contentType: file.type,
      size: file.size,
      localPreviewUrl: URL.createObjectURL(file),
    };
  } catch (err) {
    logError("uploadFile", err);
    return null;
  }
}

/** Send a message in the current conversation */
export async function sendMessage(
  body: string,
  attachments?: Array<{ name: string; url: string; contentType: string; size: number }>
): Promise<void> {
  const c = getClient();
  if (!c) return;

  let convId = getState().conversationId;
  if (!convId) {
    convId = await createConversation();
  }
  if (!convId) return;

  try {
    await c.mutation(api.messages.send, {
      conversationId: convId as any,
      senderType: "contact",
      senderId: getState().contactId || undefined,
      body,
      attachments,
    });
  } catch (err) {
    // If conversation was deleted (stale localStorage), clear and retry
    logError("sendMessage", err);
    setState({ conversationId: null });
    const newConvId = await createConversation();
    if (newConvId) {
      try {
        await c.mutation(api.messages.send, {
          conversationId: newConvId as any,
          senderType: "contact",
          senderId: getState().contactId || undefined,
          body,
          attachments,
        });
      } catch (retryErr) {
        logError("sendMessage retry", retryErr);
      }
    }
  }
}

/** Fetch messages for the current conversation and mark as read */
export async function fetchMessages(): Promise<WidgetMessage[]> {
  const c = getClient();
  const { conversationId } = getState();
  if (!c || !conversationId) return [];

  try {
    const msgs = await c.query(api.messages.list, {
      conversationId: conversationId as any,
    });

    // Mark messages as read by the contact
    const hasUnread = msgs.some(
      (m: any) => m.senderType === "agent" && !m.readByContact
    );
    if (hasUnread) {
      c.mutation(api.messages.markAllRead, {
        conversationId: conversationId as any,
        reader: "contact",
      }).catch(() => {});
    }

    return msgs.map((m: any) => ({
      id: m._id,
      senderType: m.senderType,
      body: m.body,
      createdAt: m.createdAt,
      attachments: m.attachments?.map((att: any) => ({
        ...att,
        url: att.servingUrl || att.url,
      })) || undefined,
      article: m.article || null,
      agent: m.agent || null,
    }));
  } catch (err) {
    logError("fetchMessages", err);
    return [];
  }
}

/** Check if there's a proactive conversation for this contact (agent-initiated) */
export async function checkProactiveConversation(): Promise<{
  conversationId: string;
  unreadByContact: boolean;
} | null> {
  const c = getClient();
  const { contactId, conversationId } = getState();
  if (!c || !contactId) return null;
  // Already in a conversation — skip
  if (conversationId) return null;

  try {
    const result = await c.query(api.conversations.getActiveForContact, {
      contactId: contactId as any,
    });
    if (result) {
      return { conversationId: result._id, unreadByContact: result.unreadByContact };
    }
    return null;
  } catch (err) {
    logError("checkProactiveConversation", err);
    return null;
  }
}

// --- Page view tracking ---

export async function recordPageView(): Promise<void> {
  const c = getClient();
  const { contactId } = getState();
  if (!c || !contactId) return;
  try {
    await c.mutation(api.pageViews.record, {
      contactId: contactId as any,
      url: window.location.href,
      title: document.title || undefined,
      referrer: document.referrer || undefined,
    });
  } catch (err) {
    logError("recordPageView", err);
  }
}

// --- Visitor presence heartbeat ---

export async function sendHeartbeat(): Promise<void> {
  const c = getClient();
  const { contactId, organizationId } = getState();
  if (!c || !contactId || !organizationId) return;
  try {
    await c.mutation(api.visitorPresence.heartbeat, {
      contactId: contactId as any,
      organizationId: organizationId as any,
      currentUrl: window.location.href,
      currentTitle: document.title || undefined,
    });
  } catch (err) {
    logError("sendHeartbeat", err);
  }
}

// --- Team status ---

/** Check if any agent is online */
export async function checkTeamOnline(): Promise<boolean> {
  const c = getClient();
  const { organizationId } = getState();
  if (!c || !organizationId) return false;
  try {
    return await c.query(api.agents.isTeamOnline, {
      organizationId: organizationId as any,
    });
  } catch (err) {
    logError("checkTeamOnline", err);
    return false;
  }
}

/** Check if agent is typing in current conversation */
export async function checkTyping(): Promise<string | null> {
  const c = getClient();
  const { conversationId } = getState();
  if (!c || !conversationId) return null;
  try {
    const result = await c.query(api.typing.getTyping, {
      conversationId: conversationId as any,
    });
    return result?.agentName || null;
  } catch (err) {
    logError("checkTyping", err);
    return null;
  }
}
