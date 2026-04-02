import { h } from "preact";
import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { Bubble } from "./Bubble";
import { Launcher } from "./Launcher";
import { ChatView } from "./ChatView";
import { HelpdeskBrowser } from "./HelpdeskBrowser";
import { ArticleView } from "./ArticleView";
import { UpdatesView } from "./UpdatesView";
import { UpdateDetailView } from "./UpdateDetailView";
import { getState, subscribe, setState, WidgetView, WidgetTab } from "../state";
import { emit } from "../api";
import {
  fetchArticles,
  fetchCategories,
  searchArticles,
  recordView,
  recordFeedback,
  sendMessage,
  fetchMessages,
  checkTeamOnline,
  checkTyping,
  ensureContact,
  recordPageView,
  sendHeartbeat,
  checkProactiveConversation,
  fetchUpdates,
  countNewUpdates,
  fetchWidgetConfig,
  checkAndClearStaleConversation,
  fetchTeamMembers,
  WidgetArticle,
  WidgetCategory,
  WidgetMessage,
  WidgetUpdate,
  WidgetTeamMember,
} from "../convex";

// Base64 notification sound — short "ding"
const NOTIFICATION_SOUND =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

function playNotificationSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

export function App() {
  const [state, setLocalState] = useState(getState());
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [articles, setArticles] = useState<WidgetArticle[]>([]);
  const [categories, setCategories] = useState<WidgetCategory[]>([]);
  const [currentArticle, setCurrentArticle] = useState<WidgetArticle | null>(null);
  const [updates, setUpdates] = useState<WidgetUpdate[]>([]);
  const [currentUpdate, setCurrentUpdate] = useState<WidgetUpdate | null>(null);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);
  const [teamMembers, setTeamMembers] = useState<WidgetTeamMember[]>([]);
  const [teamOnline, setTeamOnline] = useState(false);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalTitleRef = useRef<string>(document.title);
  const inactivityTimeoutRef = useRef<number>(240);

  const { color, greeting, position, siteUrl } = state;

  // Show email prompt after first message if no email set
  const showEmailPrompt = !state.user?.email && !state.contactId;

  const startTitleFlash = useCallback(() => {
    if (titleFlashRef.current) return;
    originalTitleRef.current = document.title;
    let show = true;
    titleFlashRef.current = setInterval(() => {
      document.title = show ? "New message..." : originalTitleRef.current;
      show = !show;
    }, 1000);
  }, []);

  const stopTitleFlash = useCallback(() => {
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current);
      titleFlashRef.current = null;
      document.title = originalTitleRef.current;
    }
  }, []);

  useEffect(() => {
    if (state.view === "chat") stopTitleFlash();
  }, [state.view, stopTitleFlash]);

  useEffect(() => {
    const onFocus = () => {
      if (getState().view === "chat") stopTitleFlash();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [stopTitleFlash]);

  // Sync contact data on load when user info is provided
  useEffect(() => {
    if (state.user?.email || state.user?.name) {
      ensureContact();
    }
  }, []);

  // Track page views and presence when contact is known
  useEffect(() => {
    if (state.contactId) {
      recordPageView();
      sendHeartbeat();

      const onNav = () => {
        recordPageView();
        sendHeartbeat();
      };
      window.addEventListener("popstate", onNav);

      const heartbeatInterval = setInterval(() => sendHeartbeat(), 30_000);

      return () => {
        window.removeEventListener("popstate", onNav);
        clearInterval(heartbeatInterval);
      };
    }
  }, [state.contactId]);

  // Fetch articles, categories, team status, widget config, and updates on mount
  useEffect(() => {
    fetchArticles().then(setArticles);
    fetchCategories().then(setCategories);
    checkTeamOnline().then(setTeamOnline);
    fetchTeamMembers().then(setTeamMembers);

    // Fetch widget config to check if updates are enabled
    fetchWidgetConfig().then(async (config) => {
      if (config) {
        setState({ updatesEnabled: config.updatesEnabled });
        inactivityTimeoutRef.current = config.chatInactivityTimeoutMinutes;

        // Check if stored conversation is stale
        if (getState().conversationId) {
          const wasStale = await checkAndClearStaleConversation(
            config.chatInactivityTimeoutMinutes
          );
          if (wasStale) {
            setMessages([]);
          }
        }

        if (config.updatesEnabled) {
          fetchUpdates().then(setUpdates);
          // Check for new updates since last seen
          const s = getState();
          const since = s.lastSeenUpdatesAt || 0;
          countNewUpdates(since).then(setNewUpdatesCount);
        }
      }
    });
  }, []);

  // Background poll: unread messages + team status + proactive conversations
  useEffect(() => {
    let interval: number;
    if (!state.contactId) {
      interval = 30_000;
    } else if (!state.conversationId && !state.isOpen) {
      interval = 15_000;
    } else if (state.view === "chat") {
      interval = 15_000;
    } else {
      interval = 10_000;
    }

    const checkUnread = async () => {
      checkTeamOnline().then((val) =>
        setTeamOnline((prev) => (prev === val ? prev : val))
      );

      const s = getState();

      if (!s.contactId) return;

      if (!s.conversationId) {
        const proactive = await checkProactiveConversation();
        if (proactive) {
          setState({ conversationId: proactive.conversationId });
          if (proactive.unreadByContact) {
            const msgs = await fetchMessages();
            if (msgs.length > 0) {
              setMessages(msgs);
              setState({ isOpen: true, view: "chat", unreadCount: msgs.length });
              startTitleFlash();
              playNotificationSound();
            }
          }
        }
        return;
      }

      if (s.view === "chat") return;

      const msgs = await fetchMessages();
      if (msgs.length === 0) return;

      const lastMsg = msgs[msgs.length - 1];

      if (
        lastMsg.senderType === "agent" &&
        lastMsg.id !== s.lastSeenMessageId
      ) {
        let unread = 0;
        let pastSeen = !s.lastSeenMessageId;
        for (const msg of msgs) {
          if (msg.id === s.lastSeenMessageId) {
            pastSeen = true;
            continue;
          }
          if (pastSeen && msg.senderType === "agent") unread++;
        }

        if (s.view !== "chat" && unread > 0) {
          setState({ unreadCount: unread });
          setState({ isOpen: true, view: "chat" });
          setMessages(msgs);
          startTitleFlash();
          playNotificationSound();
        }
      }
    };

    checkUnread();
    bgPollRef.current = setInterval(checkUnread, interval);
    return () => {
      if (bgPollRef.current) clearInterval(bgPollRef.current);
    };
  }, [startTitleFlash, state.contactId, state.conversationId, state.isOpen, state.view]);

  // Active chat poll: fast polling when chat view is open
  useEffect(() => {
    if (state.view === "chat" && state.conversationId) {
      const poll = async () => {
        const msgs = await fetchMessages();
        setMessages((prev) => {
          if (
            prev.length === msgs.length &&
            prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id
          )
            return prev;
          return msgs;
        });

        if (msgs.length > 0) {
          setState({
            unreadCount: 0,
            lastSeenMessageId: msgs[msgs.length - 1].id,
          });
        }

        const typing = await checkTyping();
        setTypingAgent((prev) => (prev === typing ? prev : typing));
      };
      poll();
      chatPollRef.current = setInterval(poll, 2000);

      // Separate slower check for conversation resolved/closed by agent
      const statusCheck = setInterval(async () => {
        const wasStale = await checkAndClearStaleConversation(
          inactivityTimeoutRef.current
        );
        if (wasStale) setMessages([]);
      }, 10000);

      return () => {
        if (chatPollRef.current) clearInterval(chatPollRef.current);
        clearInterval(statusCheck);
      };
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      setTypingAgent(null);
    }
  }, [state.view, state.conversationId]);

  // Clear messages when conversation is cleared (resolved, closed, or stale)
  useEffect(() => {
    if (!state.conversationId) {
      setMessages([]);
    }
  }, [state.conversationId]);

  // Load messages when opening chat with existing conversation
  useEffect(() => {
    if (state.view === "chat" && state.conversationId && messages.length === 0) {
      (async () => {
        const wasStale = await checkAndClearStaleConversation(
          inactivityTimeoutRef.current
        );
        if (wasStale) {
          setMessages([]);
          return;
        }
        const msgs = await fetchMessages();
        setMessages(msgs);
        if (msgs.length > 0) {
          setState({
            unreadCount: 0,
            lastSeenMessageId: msgs[msgs.length - 1].id,
          });
        }
      })();
    }
  }, [state.view, state.conversationId]);

  useEffect(() => {
    return subscribe((newState) => {
      setLocalState({ ...newState });
      if (newState.view === "article" && newState.currentArticleSlug) {
        const found = articles.find(
          (a) =>
            a.slug === newState.currentArticleSlug ||
            a._id === newState.currentArticleSlug
        );
        if (found) setCurrentArticle(found);
      }
      if (newState.view === "updateDetail" && newState.currentUpdateSlug) {
        const found = updates.find(
          (u) =>
            u.slug === newState.currentUpdateSlug ||
            u._id === newState.currentUpdateSlug
        );
        if (found) setCurrentUpdate(found);
      }
    });
  }, [articles, updates]);

  const navigate = useCallback((view: WidgetView) => {
    setState({ view, isOpen: view !== "closed" });
  }, []);

  const handleTabChange = useCallback(
    (tab: WidgetTab) => {
      setState({ activeTab: tab });
      // When switching to updates tab, mark all as seen
      if (tab === "updates") {
        setState({ lastSeenUpdatesAt: Date.now() });
        setNewUpdatesCount(0);
      }
    },
    []
  );

  const handleSendMessage = useCallback(async (
    body: string,
    attachments?: Array<{ name: string; url: string; contentType: string; size: number; localPreviewUrl?: string }>
  ) => {
    const optimistic: WidgetMessage = {
      id: "pending-" + Date.now(),
      senderType: "contact",
      body,
      createdAt: Date.now(),
      attachments: attachments?.map(a => ({
        name: a.name,
        url: a.localPreviewUrl || a.url,
        contentType: a.contentType,
        size: a.size,
      })),
    };
    setMessages((prev) => [...prev, optimistic]);
    emit("message:sent", body);

    const cleanAttachments = attachments?.map(({ localPreviewUrl, ...rest }) => rest);
    await sendMessage(body, cleanAttachments);

    const fresh = await fetchMessages();
    setMessages(fresh);
    if (fresh.length > 0) {
      setState({ lastSeenMessageId: fresh[fresh.length - 1].id });
    }
  }, []);

  const handleIdentify = useCallback(async (email: string, name: string) => {
    setState({ user: { email, name: name || undefined } });
    emit("identify", { email, name });
    await ensureContact();
  }, []);

  const handleSelectArticle = useCallback(
    (slug: string) => {
      const found = articles.find((a) => a.slug === slug || a._id === slug);
      if (found) {
        setCurrentArticle(found);
        recordView(found._id);
        navigate("article");
      }
    },
    [articles, navigate]
  );

  const handleSelectUpdate = useCallback(
    (slug: string) => {
      const found = updates.find((u) => u.slug === slug || u._id === slug);
      if (found) {
        setCurrentUpdate(found);
        navigate("updateDetail");
      }
    },
    [updates, navigate]
  );

  const handleSearch = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      fetchArticles().then(setArticles);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchArticles(query);
      setArticles(results);
    }, 300);
  }, []);

  const handleArticleFeedback = useCallback(
    (helpful: boolean) => {
      if (currentArticle) recordFeedback(currentArticle._id, helpful);
    },
    [currentArticle]
  );

  return (
    <div class={`uls-root uls-${position}`}>
      {!state.isOpen && (
        <Bubble
          color={color}
          unreadCount={state.unreadCount}
          onClick={() => {
            if (state.unreadCount > 0) navigate("chat");
            else navigate("launcher");
          }}
        />
      )}

      {state.isOpen && state.view === "launcher" && (
        <Launcher
          color={color}
          greeting={greeting}
          siteUrl={siteUrl}
          teamOnline={teamOnline}
          teamMembers={teamMembers}
          articles={articles}
          updatesEnabled={state.updatesEnabled}
          newUpdatesCount={newUpdatesCount}
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
          onOpenChat={() => navigate("chat")}
          onSelectArticle={handleSelectArticle}
          onClose={() => navigate("closed")}
        >
          {/* Docs tab content */}
          {state.activeTab === "docs" && (
            <HelpdeskBrowser
              color={color}
              siteUrl={siteUrl}
              categories={categories}
              articles={articles}
              onSelectArticle={handleSelectArticle}
              onSearch={handleSearch}
              onBack={() => handleTabChange("support")}
              onClose={() => navigate("closed")}
              showHeader={false}
            />
          )}

          {/* Updates tab content */}
          {state.activeTab === "updates" && (
            <UpdatesView
              color={color}
              updates={updates}
              onSelectUpdate={handleSelectUpdate}
            />
          )}
        </Launcher>
      )}

      {state.isOpen && state.view === "chat" && (
        <ChatView
          color={color}
          siteUrl={siteUrl}
          messages={messages}
          typingAgent={typingAgent}
          showEmailPrompt={showEmailPrompt}
          onSend={handleSendMessage}
          onIdentify={handleIdentify}
          onOpenArticle={handleSelectArticle}
          onBack={() => navigate("launcher")}
          onClose={() => navigate("closed")}
        />
      )}

      {state.isOpen && state.view === "helpdesk" && (
        <HelpdeskBrowser
          color={color}
          siteUrl={siteUrl}
          categories={categories}
          articles={articles}
          onSelectArticle={handleSelectArticle}
          onSearch={handleSearch}
          onBack={() => navigate("launcher")}
          onClose={() => navigate("closed")}
        />
      )}

      {state.isOpen && state.view === "article" && currentArticle && (
        <ArticleView
          color={color}
          title={currentArticle.title}
          description={currentArticle.description}
          content={currentArticle.content}
          onBack={() => {
            setState({ activeTab: "docs" });
            navigate("launcher");
          }}
          onClose={() => navigate("closed")}
          onOpenChat={() => navigate("chat")}
          onFeedback={handleArticleFeedback}
        />
      )}

      {state.isOpen && state.view === "updateDetail" && currentUpdate && (
        <UpdateDetailView
          color={color}
          title={currentUpdate.title}
          description={currentUpdate.description}
          type={currentUpdate.type}
          publishedAt={currentUpdate.publishedAt}
          imageUrl={currentUpdate.imageUrl}
          videoEmbed={currentUpdate.videoEmbed}
          onBack={() => {
            setState({ activeTab: "updates" });
            navigate("launcher");
          }}
          onClose={() => navigate("closed")}
        />
      )}
    </div>
  );
}
