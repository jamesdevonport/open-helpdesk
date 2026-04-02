import { getState, setState, clearSession, getUserKey, WidgetUser } from "./state";

type EventCallback = (...args: unknown[]) => void;
const eventListeners: Record<string, Set<EventCallback>> = {};

export function emit(event: string, ...args: unknown[]) {
  eventListeners[event]?.forEach((fn) => fn(...args));
}

export const api = {
  open() {
    setState({ isOpen: true, view: "launcher" });
    emit("open");
  },

  close() {
    setState({ isOpen: false, view: "closed" });
    emit("close");
  },

  toggle() {
    if (getState().isOpen) {
      api.close();
    } else {
      api.open();
    }
  },

  openChat(message?: string) {
    setState({ isOpen: true, view: "chat" });
    emit("open");
    if (message) {
      emit("prefill", message);
    }
  },

  openHelpdesk() {
    setState({ isOpen: true, view: "helpdesk" });
    emit("open");
  },

  openArticle(slugOrId: string) {
    setState({
      isOpen: true,
      view: "article",
      currentArticleSlug: slugOrId,
    });
    emit("open");
  },

  searchArticles(query: string) {
    setState({ isOpen: true, view: "helpdesk" });
    emit("open");
    emit("search", query);
  },

  openUpdates() {
    setState({ isOpen: true, view: "launcher", activeTab: "updates" });
    emit("open");
  },

  openUpdate(slugOrId: string) {
    setState({
      isOpen: true,
      view: "updateDetail",
      currentUpdateSlug: slugOrId,
    });
    emit("open");
  },

  identify(user: WidgetUser) {
    const { user: current, contactId } = getState();
    const newKey = getUserKey(user);
    const currentKey = getUserKey(current);
    const userChanged = contactId && newKey !== currentKey;

    if (userChanged) {
      setState({
        user,
        contactId: null,
        conversationId: null,
        lastSeenMessageId: null,
        unreadCount: 0,
      });
      clearSession();
    } else {
      setState({ user });
    }

    emit("identify", user);
  },

  reset() {
    setState({
      user: null,
      contactId: null,
      conversationId: null,
      lastSeenMessageId: null,
      unreadCount: 0,
    });
    clearSession();
    emit("reset");
  },

  on(event: string, callback: EventCallback) {
    if (!eventListeners[event]) {
      eventListeners[event] = new Set();
    }
    eventListeners[event].add(callback);
  },

  off(event: string, callback: EventCallback) {
    eventListeners[event]?.delete(callback);
  },
};
