import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { requireAgent, requireOrgAccess } from "./lib/auth";

// Internal: for CLI/admin lookups
export const lookupByEmail = internalQuery({
  args: { organizationId: v.id("organizations"), email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email)
      )
      .first();
  },
});

export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();
    return allContacts
      .filter(
        (c) =>
          c.email?.trim() || c.name?.trim() || c.externalId?.trim()
      )
      .slice(0, 100);
  },
});

export const get = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;
    if (contact.organizationId !== agent.organizationId) return null;
    return contact;
  },
});

export const getByEmail = query({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email)
      )
      .first();
  },
});

// Public: widget creates contacts
export const getOrCreate = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    externalId: v.optional(v.string()),
    metadata: v.optional(v.any()),
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
  },
  handler: async (ctx, args) => {
    // Try to find by email first
    if (args.email) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("email", args.email!)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          lastSeenAt: Date.now(),
          ...(args.name && { name: args.name }),
          ...(args.browserInfo && { browserInfo: args.browserInfo }),
          ...(args.metadata && { metadata: args.metadata }),
        });
        return existing._id;
      }
    }

    // Try by external ID
    if (args.externalId) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_external_id", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("externalId", args.externalId!)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          lastSeenAt: Date.now(),
          ...(args.name && { name: args.name }),
          ...(args.email && { email: args.email }),
          ...(args.browserInfo && { browserInfo: args.browserInfo }),
          ...(args.metadata && { metadata: args.metadata }),
        });
        return existing._id;
      }
    }

    // Create new contact
    const now = Date.now();
    return await ctx.db.insert("contacts", {
      organizationId: args.organizationId,
      email: args.email,
      name: args.name,
      externalId: args.externalId,
      metadata: args.metadata,
      browserInfo: args.browserInfo,
      tags: [],
      firstSeenAt: now,
      lastSeenAt: now,
    });
  },
});

export const update = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    externalId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    if (contact.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this contact.");
    }
    const { contactId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(contactId, filtered);
  },
});

export const addTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    if (contact.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this contact.");
    }
    const tags = contact.tags || [];
    if (!tags.includes(args.tag)) {
      await ctx.db.patch(args.contactId, { tags: [...tags, args.tag] });
    }
  },
});

export const removeTag = mutation({
  args: {
    contactId: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    if (contact.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this contact.");
    }
    const tags = (contact.tags || []).filter((t) => t !== args.tag);
    await ctx.db.patch(args.contactId, { tags });
  },
});

export const getConversations = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.organizationId !== agent.organizationId) return [];
    return await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(50);
  },
});
