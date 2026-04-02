import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireOrgAccess } from "./lib/auth";

// Public: widget needs these
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    collectionId: v.optional(v.id("collections")),
  },
  handler: async (ctx, args) => {
    if (args.collectionId) {
      return await ctx.db
        .query("categories")
        .withIndex("by_collection", (q) =>
          q.eq("collectionId", args.collectionId!)
        )
        .collect();
    }
    return await ctx.db
      .query("categories")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

// Public: widget needs this
export const get = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    collectionId: v.optional(v.id("collections")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const now = Date.now();
    return await ctx.db.insert("categories", {
      organizationId: args.organizationId,
      collectionId: args.collectionId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      order: args.order || 0,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    collectionId: v.optional(v.id("collections")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");
    await requireOrgAccess(ctx, category.organizationId);
    const { categoryId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(categoryId, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");
    await requireOrgAccess(ctx, category.organizationId);
    await ctx.db.delete(args.categoryId);
  },
});
