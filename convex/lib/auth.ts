import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Require that the request is authenticated.
 * Throws if the user is not logged in.
 * Returns the UserIdentity.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const userId = await getAuthUserId(ctx);
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || !userId) {
    throw new Error("Not authenticated");
  }
  return { identity, userId };
}

/**
 * Require that the authenticated user is a registered agent.
 * Looks up the agent by tokenIdentifier (stored as externalAuthId).
 * Throws if the user is not authenticated or not found as an agent.
 * Returns the agent document.
 */
export async function requireAgent(ctx: QueryCtx | MutationCtx) {
  const { identity, userId } = await requireAuth(ctx);

  const agentByAuthUser = await ctx.db
    .query("agents")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
    .unique();
  if (agentByAuthUser) return agentByAuthUser;

  // Match by email first (stable across sessions)
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
  const parts = identity.tokenIdentifier.split("|");
  if (parts.length >= 2) {
    const userId = parts[1];
    const user = await ctx.db.get(userId as any);
    if (user && (user as any).email) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_email", (q) => q.eq("email", (user as any).email))
        .first();
      if (agent) return agent;
    }
  }

  throw new Error("Agent not found. You must be a registered agent to access this resource.");
}

/**
 * Require that the authenticated agent belongs to the specified organization.
 * Throws if the user is not authenticated, not an agent, or not in the org.
 * Returns the agent document.
 */
export async function requireOrgAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
) {
  const agent = await requireAgent(ctx);
  if (agent.organizationId !== organizationId) {
    throw new Error("You do not have access to this organization.");
  }
  return agent;
}
