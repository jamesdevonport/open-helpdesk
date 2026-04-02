import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAgent, requireOrgAccess } from "./lib/auth";

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);

    if (args.categoryId) {
      return await ctx.db
        .query("articles")
        .withIndex("by_category", (q) =>
          q.eq("categoryId", args.categoryId!)
        )
        .order("asc")
        .collect();
    }

    const status = args.status || "published";
    return await ctx.db
      .query("articles")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", status)
      )
      .order("asc")
      .collect();
  },
});

export const get = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    const article = await ctx.db.get(args.articleId);
    if (!article) return null;
    if (article.organizationId !== agent.organizationId) return null;

    const category = article.categoryId
      ? await ctx.db.get(article.categoryId)
      : null;

    return { ...article, category };
  },
});

// Public: widget and help center use this
export const getBySlug = query({
  args: {
    organizationId: v.id("organizations"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug)
      )
      .first();
    if (!article) return null;

    const category = article.categoryId
      ? await ctx.db.get(article.categoryId)
      : null;

    return { ...article, category };
  },
});

// Public: help center and widget use this
export const listPublished = query({
  args: {
    organizationId: v.id("organizations"),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      return await ctx.db
        .query("articles")
        .withIndex("by_category", (q) =>
          q.eq("categoryId", args.categoryId!)
        )
        .order("asc")
        .collect()
        .then((articles) =>
          articles.filter((a) => a.status === "published")
        );
    }
    return await ctx.db
      .query("articles")
      .withIndex("by_organization_status", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("status", "published")
      )
      .order("asc")
      .collect();
  },
});

// Public: widget uses this
export const search = query({
  args: {
    organizationId: v.id("organizations"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const titleResults = await ctx.db
      .query("articles")
      .withSearchIndex("search_title", (q) =>
        q
          .search("title", args.query)
          .eq("organizationId", args.organizationId)
          .eq("status", "published")
      )
      .take(10);

    const contentResults = await ctx.db
      .query("articles")
      .withSearchIndex("search_content", (q) =>
        q
          .search("content", args.query)
          .eq("organizationId", args.organizationId)
          .eq("status", "published")
      )
      .take(10);

    // Deduplicate
    const seen = new Set<string>();
    const combined = [];
    for (const article of [...titleResults, ...contentResults]) {
      if (!seen.has(article._id)) {
        seen.add(article._id);
        combined.push(article);
      }
    }

    return combined;
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    categoryId: v.optional(v.id("categories")),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    status: v.string(),
    visibility: v.optional(v.string()),
    order: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrgAccess(ctx, args.organizationId);
    const now = Date.now();
    return await ctx.db.insert("articles", {
      organizationId: args.organizationId,
      categoryId: args.categoryId,
      title: args.title,
      slug: args.slug,
      description: args.description,
      content: args.content,
      status: args.status,
      visibility: args.visibility || "visible",
      order: args.order || 0,
      featured: args.featured || false,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
    });
  },
});

export const update = mutation({
  args: {
    articleId: v.id("articles"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.string()),
    visibility: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    order: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    // Verify the article belongs to the agent's organization
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    if (article.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this article.");
    }
    const { articleId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(articleId, {
      ...filtered,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);
    // Verify the article belongs to the agent's organization
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    if (article.organizationId !== agent.organizationId) {
      throw new Error("You do not have access to this article.");
    }
    await ctx.db.delete(args.articleId);
  },
});

// Public: widget uses this
export const recordView = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (article) {
      await ctx.db.patch(args.articleId, {
        viewCount: (article.viewCount || 0) + 1,
      });
    }
  },
});

// Public: widget uses this
export const recordFeedback = mutation({
  args: {
    articleId: v.id("articles"),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (article) {
      if (args.helpful) {
        await ctx.db.patch(args.articleId, {
          helpfulCount: (article.helpfulCount || 0) + 1,
        });
      } else {
        await ctx.db.patch(args.articleId, {
          notHelpfulCount: (article.notHelpfulCount || 0) + 1,
        });
      }
    }
  },
});
