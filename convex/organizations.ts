import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireOrgAccess } from "./lib/auth";

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db.get(args.organizationId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getPublicContext = query({
  args: {},
  handler: async (ctx) => {
    const organization = await ctx.db.query("organizations").order("asc").first();
    if (!organization) {
      return null;
    }

    return {
      organizationId: organization._id,
      name: organization.name,
      slug: organization.slug,
      widgetColor: organization.widgetColor ?? "#1977f2",
      widgetGreeting:
        organization.widgetGreeting || `Need help with ${organization.name}?`,
      widgetPosition: organization.widgetPosition || "bottom-right",
      widgetUpdatesEnabled: organization.widgetUpdatesEnabled ?? false,
      chatInactivityTimeoutMinutes:
        organization.chatInactivityTimeoutMinutes ?? 240,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    widgetColor: v.optional(v.string()),
    widgetGreeting: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      widgetColor: args.widgetColor || "#2563eb",
      widgetPosition: "bottom-right",
      widgetGreeting: args.widgetGreeting || "Hi! How can we help?",
      emailFallbackDelayMinutes: 5,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    widgetColor: v.optional(v.string()),
    widgetPosition: v.optional(v.string()),
    widgetGreeting: v.optional(v.string()),
    widgetLogo: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    emailFallbackDelayMinutes: v.optional(v.number()),
    widgetUpdatesEnabled: v.optional(v.boolean()),
    chatInactivityTimeoutMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const { organizationId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(organizationId, filtered);
  },
});

// Public: widget uses this to fetch config without auth
export const getWidgetConfig = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) return null;
    return {
      updatesEnabled: org.widgetUpdatesEnabled ?? false,
      chatInactivityTimeoutMinutes: org.chatInactivityTimeoutMinutes ?? 240,
      color: org.widgetColor,
      greeting: org.widgetGreeting,
      position: org.widgetPosition,
    };
  },
});
