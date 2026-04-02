import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAgent, requireOrgAccess } from "./lib/auth";

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    assignedAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);

    let q;

    if (args.status) {
      q = ctx.db
        .query("conversations")
        .withIndex("by_organization_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      q = ctx.db
        .query("conversations")
        .withIndex("by_organization_unread", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .order("desc");
    }

    const conversations = await q.take(50);

    const withContacts = await Promise.all(
      conversations.map(async (conv) => {
        const contact = await ctx.db.get(conv.contactId);
        const assignedAgent = conv.assignedAgentId
          ? await ctx.db.get(conv.assignedAgentId)
          : null;
        return { ...conv, contact, assignedAgent };
      })
    );

    return withContacts;
  },
});

export const search = query({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);

    const searchLower = args.query.toLowerCase();

    // Get recent conversations and filter by contact name/email
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(200);

    const results = [];
    for (const conv of conversations) {
      const contact = await ctx.db.get(conv.contactId);
      if (!contact) continue;

      const nameMatch = contact.name?.toLowerCase().includes(searchLower);
      const emailMatch = contact.email?.toLowerCase().includes(searchLower);
      const previewMatch = conv.lastMessagePreview?.toLowerCase().includes(searchLower);

      if (nameMatch || emailMatch || previewMatch) {
        const assignedAgent = conv.assignedAgentId
          ? await ctx.db.get(conv.assignedAgentId)
          : null;
        results.push({ ...conv, contact, assignedAgent });
      }

      if (results.length >= 20) break;
    }

    return results;
  },
});

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (conversation.organizationId !== agent.organizationId) return null;

    const contact = await ctx.db.get(conversation.contactId);
    const assignedAgent = conversation.assignedAgentId
      ? await ctx.db.get(conversation.assignedAgentId)
      : null;

    return { ...conversation, contact, assignedAgent };
  },
});

export const updateStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this conversation.");
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "resolved") {
      updates.resolvedAt = Date.now();
    }
    await ctx.db.patch(args.conversationId, updates);

    // Notify Slack thread of status change
    if (conversation.slackThreadTs && conversation.slackChannelId) {
      await ctx.scheduler.runAfter(0, internal.slack.notifyStatusChange, {
        conversationId: args.conversationId,
        slackThreadTs: conversation.slackThreadTs,
        slackChannelId: conversation.slackChannelId,
        status: args.status,
        agentName: agent.name,
      });
    }
  },
});

export const assign = mutation({
  args: {
    conversationId: v.id("conversations"),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this conversation.");
    }
    await ctx.db.patch(args.conversationId, {
      assignedAgentId: args.agentId,
    });
  },
});

// Public: widget checks for an active conversation (e.g. proactive message from agent)
export const getActiveForContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .first();

    if (!conversation) return null;
    if (conversation.status === "closed" || conversation.status === "resolved") return null;

    return { _id: conversation._id, unreadByContact: conversation.unreadByContact };
  },
});

// Public: widget creates conversations
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    contactId: v.id("contacts"),
    channel: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      organizationId: args.organizationId,
      contactId: args.contactId,
      channel: args.channel,
      subject: args.subject,
      status: "open",
      lastMessageAt: now,
      unreadByAgent: true,
      unreadByContact: false,
      createdAt: now,
    });
  },
});

// Agent opens a conversation with a visitor (reuses existing open one if any)
export const startConversation = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    // Check for an existing open/pending conversation with this contact
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .first();

    if (existing && (existing.status === "open" || existing.status === "pending")) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      organizationId: contact.organizationId,
      contactId: args.contactId,
      channel: "chat",
      status: "open",
      assignedAgentId: agent._id,
      lastMessageAt: now,
      unreadByAgent: false,
      unreadByContact: false,
      createdAt: now,
    });
  },
});

// Public: widget checks conversation status for staleness
export const getStatus = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    return {
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
    };
  },
});

// Public: widget auto-resolves stale conversations.
// conversationId acts as a capability token — Convex IDs are unguessable.
export const autoResolve = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (conversation.status !== "open" && conversation.status !== "pending") return;
    await ctx.db.patch(args.conversationId, {
      status: "resolved",
      resolvedAt: Date.now(),
    });
  },
});

// Cron: auto-resolve stale chat conversations
export const autoResolveStale = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_organization_status")
      .order("desc")
      .take(200);

    let resolved = 0;
    for (const conv of conversations) {
      if (
        (conv.status === "open" || conv.status === "pending") &&
        conv.channel === "chat" &&
        conv.lastMessageAt < fourHoursAgo
      ) {
        await ctx.db.patch(conv._id, {
          status: "resolved",
          resolvedAt: Date.now(),
        });
        resolved++;
        if (resolved >= 100) break;
      }
    }
  },
});

// Agent path requires auth + org check; contact path is public (widget capability token)
export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    reader: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.reader === "agent") {
      const agent = await requireAgent(ctx);
      const conversation = await ctx.db.get(args.conversationId);
      if (!conversation) throw new Error("Conversation not found");
      if (conversation.organizationId !== agent.organizationId) {
        throw new Error("You do not have access to this conversation.");
      }
      await ctx.db.patch(args.conversationId, { unreadByAgent: false });
    } else {
      await ctx.db.patch(args.conversationId, { unreadByContact: false });
    }
  },
});
