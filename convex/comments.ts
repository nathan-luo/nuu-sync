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

export const createComment = mutation({
  args: {
    documentId: v.id("documents"),
    highlightId: v.optional(v.id("highlights")),
    parentCommentId: v.optional(v.id("comments")),
    content: v.string(),
    mentions: v.array(v.id("users")),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    
    return await ctx.db.insert("comments", {
      documentId: args.documentId,
      highlightId: args.highlightId,
      parentCommentId: args.parentCommentId,
      userId,
      content: args.content,
      mentions: args.mentions,
      position: args.position,
    });
  },
});

export const getDocumentComments = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();

    return await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const mentionedUsers = await Promise.all(
          comment.mentions.map(async (mentionId) => {
            const mentionedUser = await ctx.db.get(mentionId);
            return {
              id: mentionId,
              name: mentionedUser?.name || mentionedUser?.email || "Unknown",
            };
          })
        );

        return {
          ...comment,
          userName: user?.name || user?.email || "Unknown",
          mentionedUsers,
        };
      })
    );
  },
});

export const getCommentReplies = query({
  args: { parentCommentId: v.id("comments") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.parentCommentId))
      .order("asc")
      .collect();

    return await Promise.all(
      replies.map(async (reply) => {
        const user = await ctx.db.get(reply.userId);
        return {
          ...reply,
          userName: user?.name || user?.email || "Unknown",
        };
      })
    );
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    
    if (!comment || comment.userId !== userId) {
      throw new Error("Not authorized to edit this comment");
    }

    await ctx.db.patch(args.commentId, { content: args.content });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    
    if (!comment || comment.userId !== userId) {
      throw new Error("Not authorized to delete this comment");
    }

    // Delete all replies to this comment
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.commentId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.commentId);
  },
});
