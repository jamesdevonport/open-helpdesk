import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireAgent } from "./lib/auth";

// Generate a short-lived upload URL for Convex file storage (agent only)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAgent(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Generate an upload URL for widget visitors (no agent auth required)
export const generateWidgetUploadUrl = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a serving URL for a stored file
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Public: widget needs to read messages
// Joins article data when a message has an articleId
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        // Join article data
        const article = msg.articleId
          ? await ctx.db.get(msg.articleId)
          : null;

        // Join agent data for agent messages
        let agent: { name: string; avatarUrl: string | null } | null = null;
        if (msg.senderType === "agent" && msg.senderId) {
          const agentDoc = await ctx.db.get(
            msg.senderId as any as import("./_generated/dataModel").Id<"agents">
          );
          if (agentDoc) {
            agent = {
              name: agentDoc.name,
              avatarUrl: agentDoc.avatarUrl ?? null,
            };
          }
        }

        // Resolve attachment storage IDs to serving URLs
        let attachments = msg.attachments;
        if (msg.attachments && msg.attachments.length > 0) {
          attachments = await Promise.all(
            msg.attachments.map(async (att) => {
              try {
                const url = await ctx.storage.getUrl(
                  att.url as Id<"_storage">
                );
                return { ...att, servingUrl: url || undefined };
              } catch {
                return att;
              }
            })
          );
        }

        return {
          ...msg,
          attachments,
          agent,
          article: article
            ? {
                _id: article._id,
                title: article.title,
                slug: article.slug,
                description: article.description,
                content: article.content,
              }
            : null,
        };
      })
    );
  },
});

// Public for contacts, but agent senders must be authenticated
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderType: v.string(),
    senderId: v.optional(v.string()),
    body: v.string(),
    articleId: v.optional(v.id("articles")),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          contentType: v.string(),
          size: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    let senderId = args.senderId;
    if (args.senderType === "agent") {
      const agent = await requireAgent(ctx);
      const conversation = await ctx.db.get(args.conversationId);
      if (!conversation) throw new Error("Conversation not found");
      if (conversation.organizationId !== agent.organizationId) {
        throw new Error("You do not have access to this conversation.");
      }
      senderId = agent._id;
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderType: args.senderType,
      senderId,
      body: args.body,
      articleId: args.articleId,
      attachments: args.attachments,
      readByAgent: args.senderType === "agent",
      readByContact: args.senderType === "contact",
      deliveredVia: "chat",
      createdAt: now,
    });

    const preview = args.articleId
      ? "Shared an article"
      : args.attachments && args.attachments.length > 0 && !args.body
        ? "Sent an image"
        : args.body.length > 100
          ? args.body.slice(0, 100) + "..."
          : args.body;

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
      lastMessageSender: args.senderType,
      unreadByAgent: args.senderType === "contact",
      unreadByContact: args.senderType === "agent",
      status: "open",
    });

    // Notify Slack (skips if not configured or if message came from Slack)
    await ctx.scheduler.runAfter(0, internal.slack.notifySlack, {
      conversationId: args.conversationId,
      messageId,
    });

    return messageId;
  },
});

// Public: widget uses this
export const markAllRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    reader: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const field =
      args.reader === "agent" ? "readByAgent" : "readByContact";

    for (const message of messages) {
      if (!message[field]) {
        await ctx.db.patch(message._id, { [field]: true });
      }
    }
  },
});
