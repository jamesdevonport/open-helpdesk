import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireOrgAccess } from "./lib/auth";

// Public: widget sends heartbeats
export const heartbeat = mutation({
  args: {
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    currentUrl: v.string(),
    currentTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitorPresence")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentUrl: args.currentUrl,
        currentTitle: args.currentTitle,
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.insert("visitorPresence", {
        contactId: args.contactId,
        organizationId: args.organizationId,
        currentUrl: args.currentUrl,
        currentTitle: args.currentTitle,
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Dashboard: list visitors active in the last 5 minutes
export const listActive = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const presenceRows = await ctx.db
      .query("visitorPresence")
      .withIndex("by_organization_and_lastActiveAt", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .gte("lastActiveAt", fiveMinutesAgo)
      )
      .order("desc")
      .take(50);

    return await Promise.all(
      presenceRows.map(async (p) => {
        const contact = await ctx.db.get(p.contactId);
        return {
          presenceId: p._id,
          contactId: p.contactId,
          currentUrl: p.currentUrl,
          currentTitle: p.currentTitle,
          lastActiveAt: p.lastActiveAt,
          name: contact?.name ?? null,
          email: contact?.email ?? null,
          avatarUrl: contact?.avatarUrl ?? null,
          city: contact?.browserInfo?.city ?? null,
          country: contact?.browserInfo?.country ?? null,
        };
      })
    );
  },
});

// Cleanup stale presence rows older than 1 hour
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const stale = await ctx.db
      .query("visitorPresence")
      .withIndex("by_organization_and_lastActiveAt")
      .order("asc")
      .take(100);

    for (const row of stale) {
      if (row.lastActiveAt < oneHourAgo) {
        await ctx.db.delete(row._id);
      }
    }
  },
});
