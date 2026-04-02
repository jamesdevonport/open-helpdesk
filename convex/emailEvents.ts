import { v } from "convex/values";
import { query } from "./_generated/server";

export const findByMessageId = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailEvents")
      .withIndex("by_postmark_id", (q) =>
        q.eq("postmarkMessageId", args.messageId)
      )
      .first();
  },
});
