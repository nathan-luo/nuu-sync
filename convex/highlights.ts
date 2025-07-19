import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getLoggedInUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

export const createHighlightWithComment = mutation({
  args: {
    documentId: v.id("documents"),
    startOffset: v.number(),
    endOffset: v.number(),
    selectedText: v.string(),
    color: v.string(),
    commentContent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    
    // Create the highlight first
    const highlightId = await ctx.db.insert("highlights", {
      documentId: args.documentId,
      userId,
      startOffset: args.startOffset,
      endOffset: args.endOffset,
      selectedText: args.selectedText,
      color: args.color,
    });

    // Create the associated comment
    await ctx.db.insert("comments", {
      documentId: args.documentId,
      highlightId,
      userId,
      content: args.commentContent,
      mentions: [],
    });

    return highlightId;
  },
});

export const getDocumentHighlights = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const highlights = await ctx.db
      .query("highlights")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return await Promise.all(
      highlights.map(async (highlight) => {
        const user = await ctx.db.get(highlight.userId);
        return {
          ...highlight,
          userName: user?.name || user?.email || "Unknown",
        };
      })
    );
  },
});

export const deleteHighlight = mutation({
  args: { highlightId: v.id("highlights") },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const highlight = await ctx.db.get(args.highlightId);
    
    if (!highlight || highlight.userId !== userId) {
      throw new Error("Not authorized to delete this highlight");
    }

    // Delete associated comments first
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.highlightId);
  },
});
