import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    widgetColor: v.optional(v.string()),
    widgetPosition: v.optional(v.string()),
    widgetGreeting: v.optional(v.string()),
    widgetLogo: v.optional(v.string()),
    emailDomain: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    postmarkInboundAddress: v.optional(v.string()),
    emailFallbackDelayMinutes: v.optional(v.number()),
    widgetUpdatesEnabled: v.optional(v.boolean()),
    chatInactivityTimeoutMinutes: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  agents: defineTable({
    organizationId: v.id("organizations"),
    authUserId: v.optional(v.id("users")),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.string(),
    status: v.string(),
    externalAuthId: v.optional(v.string()),
    slackUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_auth_user", ["authUserId"])
    .index("by_email", ["email"])
    .index("by_external_auth", ["externalAuthId"])
    .index("by_slack_user", ["slackUserId"]),

  pushSubscriptions: defineTable({
    organizationId: v.id("organizations"),
    agentId: v.id("agents"),
    endpoint: v.string(),
    expirationTime: v.optional(v.number()),
    auth: v.string(),
    p256dh: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agentId_and_endpoint", ["agentId", "endpoint"])
    .index("by_organizationId", ["organizationId"])
    .index("by_endpoint", ["endpoint"]),

  contacts: defineTable({
    organizationId: v.id("organizations"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastContactedAt: v.optional(v.number()),
    browserInfo: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        language: v.optional(v.string()),
        timezone: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        currentUrl: v.optional(v.string()),
        country: v.optional(v.string()),
        countryCode: v.optional(v.string()),
        city: v.optional(v.string()),
      })
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["organizationId", "email"])
    .index("by_external_id", ["organizationId", "externalId"])
    .index("by_last_seen", ["organizationId", "lastSeenAt"]),

  conversations: defineTable({
    organizationId: v.id("organizations"),
    contactId: v.id("contacts"),
    assignedAgentId: v.optional(v.id("agents")),
    subject: v.optional(v.string()),
    status: v.string(),
    channel: v.string(),
    priority: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    lastMessageSender: v.optional(v.string()),
    unreadByAgent: v.boolean(),
    unreadByContact: v.boolean(),
    emailThreadId: v.optional(v.string()),
    slackThreadTs: v.optional(v.string()),
    slackChannelId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_organization_status", [
      "organizationId",
      "status",
      "lastMessageAt",
    ])
    .index("by_organization_unread", [
      "organizationId",
      "unreadByAgent",
      "lastMessageAt",
    ])
    .index("by_contact", ["contactId", "createdAt"])
    .index("by_assigned_agent", [
      "assignedAgentId",
      "status",
      "lastMessageAt",
    ])
    .index("by_email_thread", ["emailThreadId"])
    .index("by_slack_thread", ["slackChannelId", "slackThreadTs"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderType: v.string(),
    senderId: v.optional(v.string()),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
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
    articleId: v.optional(v.id("articles")),
    emailMessageId: v.optional(v.string()),
    readByAgent: v.boolean(),
    readByContact: v.boolean(),
    deliveredVia: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_email_message_id", ["emailMessageId"]),

  collections: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId", "order"])
    .index("by_slug", ["organizationId", "slug"]),

  categories: defineTable({
    organizationId: v.id("organizations"),
    collectionId: v.optional(v.id("collections")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId", "order"])
    .index("by_collection", ["collectionId", "order"])
    .index("by_slug", ["organizationId", "slug"]),

  articles: defineTable({
    organizationId: v.id("organizations"),
    categoryId: v.optional(v.id("categories")),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    status: v.string(),
    visibility: v.string(),
    order: v.number(),
    featured: v.boolean(),
    authorId: v.optional(v.id("agents")),
    viewCount: v.optional(v.number()),
    helpfulCount: v.optional(v.number()),
    notHelpfulCount: v.optional(v.number()),
    legacyCrispArticleId: v.optional(v.string()),
    legacyCrispCategoryId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_organization_status", ["organizationId", "status", "order"])
    .index("by_category", ["categoryId", "order"])
    .index("by_slug", ["organizationId", "slug"])
    .index("by_legacy_crisp_id", ["legacyCrispArticleId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizationId", "status"],
    })
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["organizationId", "status"],
    }),

  productUpdates: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    type: v.string(),
    status: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    videoEmbed: v.optional(v.string()),
    authorId: v.optional(v.id("agents")),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization_status", [
      "organizationId",
      "status",
      "publishedAt",
    ])
    .index("by_slug", ["organizationId", "slug"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizationId", "status"],
    }),

  tags: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  cannedResponses: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    content: v.string(),
    shortcut: v.optional(v.string()),
    createdBy: v.optional(v.id("agents")),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  emailEvents: defineTable({
    conversationId: v.optional(v.id("conversations")),
    messageId: v.optional(v.id("messages")),
    direction: v.string(),
    emailTo: v.string(),
    emailFrom: v.string(),
    subject: v.string(),
    postmarkMessageId: v.optional(v.string()),
    status: v.string(),
    rawPayload: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_postmark_id", ["postmarkMessageId"]),

  pageViews: defineTable({
    contactId: v.id("contacts"),
    url: v.string(),
    title: v.optional(v.string()),
    referrer: v.optional(v.string()),
    viewedAt: v.number(),
  }).index("by_contact", ["contactId", "viewedAt"]),

  slackEvents: defineTable({
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    direction: v.string(),
    slackTs: v.optional(v.string()),
    slackThreadTs: v.optional(v.string()),
    status: v.string(),
    eventType: v.string(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_slack_ts", ["slackTs"]),

  visitorPresence: defineTable({
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    currentUrl: v.string(),
    currentTitle: v.optional(v.string()),
    lastActiveAt: v.number(),
  })
    .index("by_organization_and_lastActiveAt", [
      "organizationId",
      "lastActiveAt",
    ])
    .index("by_contact", ["contactId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    agentId: v.id("agents"),
    agentName: v.string(),
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
