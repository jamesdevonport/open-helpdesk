import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAgent, requireOrgAccess } from "./lib/auth";

// Dashboard: authenticated, list all updates for org
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);

    const status = args.status || "published";
    return await ctx.db
      .query("productUpdates")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", status)
      )
      .order("desc")
      .take(100);
  },
});

// Dashboard: get single update with author info
export const get = query({
  args: { updateId: v.id("productUpdates") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const update = await ctx.db.get(args.updateId);
    if (!update) return null;
    if (update.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this update.");
    }

    const author = update.authorId
      ? await ctx.db.get(update.authorId)
      : null;

    // Resolve image storage URL if needed
    let resolvedImageUrl = update.imageUrl;
    if (update.imageStorageId) {
      const url = await ctx.storage.getUrl(update.imageStorageId);
      if (url) resolvedImageUrl = url;
    }

    return { ...update, author, resolvedImageUrl };
  },
});

// Public: widget uses this to list published updates
export const listPublished = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const updates = await ctx.db
      .query("productUpdates")
      .withIndex("by_organization_status", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("status", "published")
      )
      .order("desc")
      .take(limit);

    // Resolve image storage URLs
    return await Promise.all(
      updates.map(async (update) => {
        let resolvedImageUrl = update.imageUrl;
        if (update.imageStorageId) {
          const url = await ctx.storage.getUrl(update.imageStorageId);
          if (url) resolvedImageUrl = url;
        }
        return {
          _id: update._id,
          title: update.title,
          slug: update.slug,
          description: update.description,
          type: update.type,
          imageUrl: resolvedImageUrl,
          videoEmbed: update.videoEmbed,
          publishedAt: update.publishedAt,
        };
      })
    );
  },
});

// Public: widget uses this
export const getBySlug = query({
  args: {
    organizationId: v.id("organizations"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const update = await ctx.db
      .query("productUpdates")
      .withIndex("by_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug)
      )
      .first();
    if (!update || update.status !== "published") return null;

    let resolvedImageUrl = update.imageUrl;
    if (update.imageStorageId) {
      const url = await ctx.storage.getUrl(update.imageStorageId);
      if (url) resolvedImageUrl = url;
    }

    return {
      _id: update._id,
      title: update.title,
      slug: update.slug,
      description: update.description,
      type: update.type,
      imageUrl: resolvedImageUrl,
      videoEmbed: update.videoEmbed,
      publishedAt: update.publishedAt,
    };
  },
});

// Public: widget indicator uses this
export const countNewSince = query({
  args: {
    organizationId: v.id("organizations"),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("productUpdates")
      .withIndex("by_organization_status", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("status", "published")
      )
      .order("desc")
      .take(50);

    return updates.filter(
      (u) => u.publishedAt && u.publishedAt > args.since
    ).length;
  },
});

// Dashboard: search updates
export const search = query({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db
      .query("productUpdates")
      .withSearchIndex("search_title", (q) =>
        q
          .search("title", args.query)
          .eq("organizationId", args.organizationId)
      )
      .take(20);
  },
});

// Dashboard: create update
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    type: v.string(),
    status: v.string(),
    imageUrl: v.optional(v.string()),
    videoEmbed: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await requireOrgAccess(ctx, args.organizationId);
    const now = Date.now();
    return await ctx.db.insert("productUpdates", {
      organizationId: args.organizationId,
      title: args.title,
      slug: args.slug,
      description: args.description,
      type: args.type,
      status: args.status,
      imageUrl: args.imageUrl,
      videoEmbed: args.videoEmbed,
      authorId: agent._id,
      publishedAt: args.publishedAt || (args.status === "published" ? now : undefined),
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Dashboard: update existing
export const update = mutation({
  args: {
    updateId: v.id("productUpdates"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    videoEmbed: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const existing = await ctx.db.get(args.updateId);
    if (!existing) throw new Error("Update not found");
    if (existing.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this update.");
    }

    const { updateId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    // Set publishedAt when first published
    if (
      updates.status === "published" &&
      existing.status !== "published" &&
      !existing.publishedAt
    ) {
      (filtered as any).publishedAt = Date.now();
    }

    await ctx.db.patch(updateId, {
      ...filtered,
      updatedAt: Date.now(),
    });
  },
});

// Dashboard: delete update
export const remove = mutation({
  args: { updateId: v.id("productUpdates") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const existing = await ctx.db.get(args.updateId);
    if (!existing) throw new Error("Update not found");
    if (existing.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this update.");
    }
    await ctx.db.delete(args.updateId);
  },
});

// Import: batch insert updates (for CSV migration)
export const importBatch = mutation({
  args: {
    organizationId: v.id("organizations"),
    updates: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        type: v.string(),
        status: v.string(),
        imageUrl: v.optional(v.string()),
        videoEmbed: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const ids = [];
    for (const update of args.updates) {
      const id = await ctx.db.insert("productUpdates", {
        organizationId: args.organizationId,
        ...update,
      });
      ids.push(id);
    }
    return ids;
  },
});

