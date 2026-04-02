import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAgent } from "./lib/auth";

// Public: widget records page views
export const record = mutation({
  args: {
    contactId: v.id("contacts"),
    url: v.string(),
    title: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pageViews", {
      contactId: args.contactId,
      url: args.url,
      title: args.title,
      referrer: args.referrer,
      viewedAt: Date.now(),
    });
  },
});

// Dashboard: get recent page views for a contact
export const listByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.organizationId !== agent.organizationId) return [];
    return await ctx.db
      .query("pageViews")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(30);
  },
});
