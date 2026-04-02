import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireOrgAccess } from "./lib/auth";

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db
      .query("tags")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db.insert("tags", {
      organizationId: args.organizationId,
      name: args.name,
      color: args.color,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) throw new Error("Tag not found");
    await requireOrgAccess(ctx, tag.organizationId);
    await ctx.db.delete(args.tagId);
  },
});
