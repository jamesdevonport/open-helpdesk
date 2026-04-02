import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireOrgAccess } from "./lib/auth";

// Public: widget/docs needs these
export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

// Public: widget/docs needs this
export const get = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.collectionId);
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const now = Date.now();
    return await ctx.db.insert("collections", {
      organizationId: args.organizationId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      order: args.order || 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) throw new Error("Collection not found");
    await requireOrgAccess(ctx, collection.organizationId);
    const { collectionId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(collectionId, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) throw new Error("Collection not found");
    await requireOrgAccess(ctx, collection.organizationId);
    await ctx.db.delete(args.collectionId);
  },
});
