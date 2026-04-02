import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Internal Mutations ──────────────────────────────────────────────

/**
 * Gather conversation, contact, and message data for a Slack post.
 * Returns everything the action needs, or { shouldPost: false }.
 */
export const prepareSlackPost = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return { shouldPost: false as const };

    // Don't echo messages that came from Slack
    if (message.deliveredVia === "slack") return { shouldPost: false as const };

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return { shouldPost: false as const };

    const contact = await ctx.db.get(conversation.contactId);

    // Get agent name if this is an agent message
    let agentName: string | undefined;
    if (message.senderType === "agent" && message.senderId) {
      const agent = await ctx.db.get(message.senderId as any);
      if (agent) agentName = (agent as any).name;
    }

    const isNewThread = !conversation.slackThreadTs;

    // Resolve image attachment storage IDs to public serving URLs
    const imageUrls: Array<{ url: string; altText: string }> = [];
    if (message.attachments) {
      for (const att of message.attachments) {
        if (att.contentType.startsWith("image/")) {
          try {
            const url = await ctx.storage.getUrl(att.url as Id<"_storage">);
            if (url) {
              imageUrls.push({ url, altText: att.name });
            }
          } catch {
            // Skip attachments that can't be resolved
          }
        }
      }
    }

    return {
      shouldPost: true as const,
      body: message.body,
      senderType: message.senderType,
      agentName,
      contactName: contact?.name,
      contactEmail: contact?.email,
      browserInfo: contact?.browserInfo,
      isNewThread,
      slackThreadTs: conversation.slackThreadTs,
      slackChannelId: conversation.slackChannelId,
      subject: conversation.subject,
      channel: conversation.channel,
      conversationId: args.conversationId,
      messageId: args.messageId,
      imageUrls,
    };
  },
});

/**
 * Save the Slack thread timestamp on the conversation after creating a new thread.
 */
export const saveSlackThread = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    slackThreadTs: v.string(),
    slackChannelId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      slackThreadTs: args.slackThreadTs,
      slackChannelId: args.slackChannelId,
    });
  },
});

/**
 * Log a Slack event for auditability.
 */
export const logEvent = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    direction: v.string(),
    slackTs: v.optional(v.string()),
    slackThreadTs: v.optional(v.string()),
    status: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("slackEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Handle an inbound Slack message (agent replying in a thread).
 * Creates a message in the matching conversation.
 */
export const handleInboundMessage = internalMutation({
  args: {
    slackThreadTs: v.string(),
    slackChannelId: v.string(),
    slackUserId: v.string(),
    text: v.string(),
    slackMessageTs: v.string(),
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
    // Find conversation by Slack thread
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_slack_thread", (q) =>
        q
          .eq("slackChannelId", args.slackChannelId)
          .eq("slackThreadTs", args.slackThreadTs)
      )
      .first();

    if (!conversation) return;

    // Look up agent by Slack user ID
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_slack_user", (q) =>
        q.eq("slackUserId", args.slackUserId)
      )
      .first();

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      senderType: "agent",
      senderId: agent?._id,
      body: args.text,
      attachments: args.attachments,
      readByAgent: true,
      readByContact: false,
      deliveredVia: "slack",
      createdAt: now,
    });

    const hasAttachments = args.attachments && args.attachments.length > 0;
    const preview =
      hasAttachments && !args.text
        ? "Sent an image"
        : args.text.length > 100
          ? args.text.slice(0, 100) + "..."
          : args.text;

    await ctx.db.patch(conversation._id, {
      lastMessageAt: now,
      lastMessagePreview: preview,
      lastMessageSender: "agent",
      unreadByAgent: false,
      unreadByContact: true,
      status: "open",
    });

    // Log the inbound event
    await ctx.db.insert("slackEvents", {
      conversationId: conversation._id,
      messageId,
      direction: "inbound",
      slackTs: args.slackMessageTs,
      slackThreadTs: args.slackThreadTs,
      status: "received",
      eventType: "message",
      createdAt: now,
    });
  },
});

// ── Internal Actions ────────────────────────────────────────────────

/**
 * Main entry point: gathers data via mutation, posts to Slack via API,
 * then saves thread info and logs the event.
 */
export const notifySlack = internalAction({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return; // Slack not configured, silently skip

    const channelId = process.env.SLACK_CHANNEL_ID;
    if (!channelId) return;

    const data = await ctx.runMutation(internal.slack.prepareSlackPost, {
      conversationId: args.conversationId,
      messageId: args.messageId,
    });

    if (!data.shouldPost) return;

    const siteUrl = process.env.SITE_URL || process.env.CONVEX_SITE_URL || "";
    const dashboardUrl = siteUrl
      ? `${siteUrl.replace(".convex.site", "")}`
      : "";

    try {
      let slackBody: Record<string, unknown>;

      if (data.isNewThread) {
        // New thread: rich Block Kit message
        const blocks = buildNewThreadBlocks({
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          browserInfo: data.browserInfo,
          body: data.body,
          channel: data.channel,
          subject: data.subject,
        });

        // Append image blocks for any attached images
        for (const img of data.imageUrls) {
          blocks.push({
            type: "image",
            image_url: img.url,
            alt_text: img.altText,
          });
        }

        slackBody = {
          channel: channelId,
          blocks,
          text: `New message from ${data.contactName || "Anonymous"}: ${data.body.slice(0, 100)}`,
        };
      } else {
        // Reply in existing thread
        const sender =
          data.senderType === "agent"
            ? `*${data.agentName || "Agent"}:*`
            : `*${data.contactName || "Customer"}:*`;

        if (data.imageUrls.length > 0) {
          // Use blocks to include images alongside text
          slackBody = {
            channel: data.slackChannelId || channelId,
            thread_ts: data.slackThreadTs,
            blocks: [
              {
                type: "section",
                text: { type: "mrkdwn", text: `${sender} ${data.body}` },
              },
              ...data.imageUrls.map((img) => ({
                type: "image",
                image_url: img.url,
                alt_text: img.altText,
              })),
            ],
            text: `${sender} ${data.body}`,
          };
        } else {
          slackBody = {
            channel: data.slackChannelId || channelId,
            thread_ts: data.slackThreadTs,
            text: `${sender} ${data.body}`,
          };
        }
      }

      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slackBody),
      });

      const result = await response.json();

      if (result.ok) {
        // Save thread ts for new threads
        if (data.isNewThread && result.ts) {
          await ctx.runMutation(internal.slack.saveSlackThread, {
            conversationId: args.conversationId,
            slackThreadTs: result.ts,
            slackChannelId: channelId,
          });
        }

        await ctx.runMutation(internal.slack.logEvent, {
          conversationId: args.conversationId,
          messageId: args.messageId,
          direction: "outbound",
          slackTs: result.ts,
          slackThreadTs: data.isNewThread ? result.ts : data.slackThreadTs,
          status: "sent",
          eventType: data.isNewThread ? "thread_created" : "message",
        });
      } else {
        await ctx.runMutation(internal.slack.logEvent, {
          conversationId: args.conversationId,
          messageId: args.messageId,
          direction: "outbound",
          status: "failed",
          eventType: data.isNewThread ? "thread_created" : "message",
        });
      }
    } catch {
      await ctx.runMutation(internal.slack.logEvent, {
        conversationId: args.conversationId,
        messageId: args.messageId,
        direction: "outbound",
        status: "failed",
        eventType: "message",
      });
    }
  },
});

/**
 * Post a status change to an existing Slack thread.
 */
export const notifyStatusChange = internalAction({
  args: {
    conversationId: v.id("conversations"),
    slackThreadTs: v.string(),
    slackChannelId: v.string(),
    status: v.string(),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return;

    const emoji = args.status === "resolved" ? ":white_check_mark:" : ":arrows_counterclockwise:";
    const text = `${emoji} Conversation marked as *${args.status}*${args.agentName ? ` by ${args.agentName}` : ""}`;

    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: args.slackChannelId,
        thread_ts: args.slackThreadTs,
        text,
      }),
    });
  },
});

/**
 * Handle an inbound Slack message that includes file attachments.
 * Downloads images from Slack, stores them in Convex, then creates the message.
 */
export const handleInboundMessageWithFiles = internalAction({
  args: {
    slackThreadTs: v.string(),
    slackChannelId: v.string(),
    slackUserId: v.string(),
    text: v.string(),
    slackMessageTs: v.string(),
    files: v.array(
      v.object({
        url: v.string(),
        name: v.string(),
        mimetype: v.string(),
        size: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const attachments: Array<{
      name: string;
      url: string;
      contentType: string;
      size: number;
    }> = [];

    for (const file of args.files) {
      if (file.size > MAX_FILE_SIZE) continue;

      try {
        const response = await fetch(file.url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) continue;

        const blob = await response.blob();
        const storageId = await ctx.storage.store(blob);

        attachments.push({
          name: file.name,
          url: storageId,
          contentType: file.mimetype,
          size: file.size,
        });
      } catch {
        // Skip files that fail to download
      }
    }

    await ctx.runMutation(internal.slack.handleInboundMessage, {
      slackThreadTs: args.slackThreadTs,
      slackChannelId: args.slackChannelId,
      slackUserId: args.slackUserId,
      text: args.text,
      slackMessageTs: args.slackMessageTs,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  },
});

// ── Block Kit Helpers ───────────────────────────────────────────────

function buildNewThreadBlocks(args: {
  contactName?: string;
  contactEmail?: string;
  browserInfo?: {
    currentUrl?: string;
    country?: string;
    city?: string;
    userAgent?: string;
    language?: string;
    timezone?: string;
    screenResolution?: string;
    countryCode?: string;
  };
  body: string;
  channel: string;
  subject?: string;
}) {
  const blocks: Record<string, unknown>[] = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `New conversation from ${args.contactName || "Anonymous"}`,
      emoji: true,
    },
  });

  // Contact info fields
  const fields: Record<string, unknown>[] = [];
  if (args.contactEmail) {
    fields.push({ type: "mrkdwn", text: `*Email:* ${args.contactEmail}` });
  }
  if (args.browserInfo?.city && args.browserInfo?.country) {
    fields.push({
      type: "mrkdwn",
      text: `*Location:* ${args.browserInfo.city}, ${args.browserInfo.country}`,
    });
  }
  if (args.browserInfo?.currentUrl) {
    fields.push({
      type: "mrkdwn",
      text: `*Page:* ${args.browserInfo.currentUrl}`,
    });
  }
  fields.push({ type: "mrkdwn", text: `*Channel:* ${args.channel}` });
  if (args.subject) {
    fields.push({ type: "mrkdwn", text: `*Subject:* ${args.subject}` });
  }

  if (fields.length > 0) {
    // Slack allows max 10 fields per section, split into pairs
    for (let i = 0; i < fields.length; i += 2) {
      blocks.push({
        type: "section",
        fields: fields.slice(i, i + 2),
      });
    }
  }

  // Divider
  blocks.push({ type: "divider" });

  // Message body
  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: args.body },
  });

  return blocks;
}
