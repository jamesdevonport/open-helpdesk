import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";

const DEFAULT_WIDGET_COLOR = "#1977f2";
const DEFAULT_WIDGET_POSITION = "bottom-right";
const DEFAULT_WIDGET_GREETING = "Hi! How can we help?";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const registrationStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("users").first();
    return { hasUsers: firstUser !== null };
  },
});

export const getBootstrapState = query({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("users").first();
    const organization = await ctx.db.query("organizations").order("asc").first();
    const authUserId = await getAuthUserId(ctx);

    const currentUser = authUserId ? await ctx.db.get(authUserId) : null;
    const currentAgent = authUserId
      ? await ctx.db
          .query("agents")
          .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
          .unique()
      : null;

    return {
      hasUsers: firstUser !== null,
      hasOrganization: organization !== null,
      organizationName: organization?.name ?? null,
      currentUser: currentUser
        ? {
            name: currentUser.name ?? null,
            email: currentUser.email ?? null,
          }
        : null,
      currentUserIsAgent: currentAgent !== null,
    };
  },
});

export const completeBootstrap = mutation({
  args: {
    organizationName: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("agents")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (existing) {
      return { organizationId: existing.organizationId, agentId: existing._id };
    }

    const existingOrganization = await ctx.db
      .query("organizations")
      .order("asc")
      .first();
    if (existingOrganization) {
      throw new Error("Workspace setup is already complete.");
    }

    const user = await ctx.db.get(authUserId);
    if (!user?.email) {
      throw new Error("Your account is missing an email address.");
    }

    const organizationName = args.organizationName.trim();
    const adminName =
      args.adminName.trim() || user.name || user.email.split("@")[0];
    const slug = slugify(organizationName) || "workspace";
    const now = Date.now();

    await ctx.db.patch(authUserId, {
      name: adminName,
      email: user.email,
    });

    const organizationId = await ctx.db.insert("organizations", {
      name: organizationName,
      slug,
      widgetColor: DEFAULT_WIDGET_COLOR,
      widgetPosition: DEFAULT_WIDGET_POSITION,
      widgetGreeting: DEFAULT_WIDGET_GREETING,
      emailFromName: `${organizationName} Support`,
      emailFallbackDelayMinutes: 5,
      widgetUpdatesEnabled: false,
      chatInactivityTimeoutMinutes: 240,
      createdAt: now,
    });

    const agentId = await ctx.db.insert("agents", {
      organizationId,
      authUserId,
      name: adminName,
      email: user.email,
      role: "admin",
      status: "online",
      createdAt: now,
    });

    return { organizationId, agentId };
  },
});
