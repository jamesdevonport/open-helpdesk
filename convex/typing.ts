import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAgent } from "./lib/auth";

// Agent sets typing — creates or updates a typing indicator that expires in 5s
export const setTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    if (existing && existing.agentId === agent._id) {
      await ctx.db.patch(existing._id, { expiresAt: Date.now() + 5000 });
    } else {
      if (existing) await ctx.db.delete(existing._id);
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        agentId: agent._id,
        agentName: agent.name,
        expiresAt: Date.now() + 5000,
      });
    }
  },
});

// Agent clears typing — removes the indicator immediately (e.g. on message send)
export const clearTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    if (existing && existing.agentId === agent._id) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Public: widget polls this to see if agent is typing
export const getTyping = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const indicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    if (!indicator || indicator.expiresAt < Date.now()) {
      return null;
    }

    return { agentName: indicator.agentName };
  },
});
