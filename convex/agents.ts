import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireAgent, requireOrgAccess } from "./lib/auth";

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    return await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const agentByAuthUser = await ctx.db
      .query("agents")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
      .unique();
    if (agentByAuthUser) return agentByAuthUser;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Match by email (stable across sessions) rather than tokenIdentifier
    // which includes the session ID and changes on every login
    if (identity.email) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (agent) return agent;
    }

    // Fallback to tokenIdentifier
    const agentByToken = await ctx.db
      .query("agents")
      .withIndex("by_external_auth", (q) =>
        q.eq("externalAuthId", identity.tokenIdentifier)
      )
      .first();
    if (agentByToken) return agentByToken;

    // Last resort: look up user record to get email
    // tokenIdentifier format: "domain|userId|sessionId"
    const parts = identity.tokenIdentifier.split("|");
    if (parts.length >= 2) {
      const userId = parts[1];
      const user = await ctx.db.get(userId as any);
      if (user && (user as any).email) {
        return await ctx.db
          .query("agents")
          .withIndex("by_email", (q) => q.eq("email", (user as any).email))
          .first();
      }
    }

    return null;
  },
});

export const get = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const callingAgent = await requireAgent(ctx);
    const targetAgent = await ctx.db.get(args.agentId);
    if (!targetAgent) return null;
    if (targetAgent.organizationId !== callingAgent.organizationId) return null;
    return targetAgent;
  },
});

export const getByExternalAuth = query({
  args: { externalAuthId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("agents")
      .withIndex("by_external_auth", (q) =>
        q.eq("externalAuthId", args.externalAuthId)
      )
      .first();
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.string()),
    authUserId: v.optional(v.id("users")),
    externalAuthId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Allow first agent creation (bootstrap), otherwise require org membership
    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first();
    if (existingAgents) {
      await requireOrgAccess(ctx, args.organizationId);
    } else {
      await requireAuth(ctx);
    }
    return await ctx.db.insert("agents", {
      organizationId: args.organizationId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      role: args.role || "agent",
      status: "offline",
      authUserId: args.authUserId,
      externalAuthId: args.externalAuthId,
      createdAt: Date.now(),
    });
  },
});

// Public: widget fetches team members for display (name + avatar)
export const listForWidget = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .take(5);
    return agents.map((a) => ({
      name: a.name,
      avatarUrl: a.avatarUrl || null,
    }));
  },
});

// Public: widget checks if any agent is online
export const isTeamOnline = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    return agents.some((a) => a.status === "online");
  },
});

export const updateStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    if (agent._id !== args.agentId) {
      throw new Error("You can only update your own status.");
    }
    await ctx.db.patch(args.agentId, { status: args.status });
  },
});

export const updateSlackUserId = mutation({
  args: {
    agentId: v.id("agents"),
    slackUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    if (agent._id !== args.agentId) {
      throw new Error("You can only update your own Slack user ID.");
    }
    await ctx.db.patch(args.agentId, { slackUserId: args.slackUserId });
  },
});

export const updateProfile = mutation({
  args: {
    agentId: v.id("agents"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    if (agent._id !== args.agentId) {
      throw new Error("You can only update your own profile.");
    }
    const { agentId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(agentId, filtered);
  },
});
