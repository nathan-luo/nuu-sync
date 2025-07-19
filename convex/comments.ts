import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

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
    
    // Check if user has access to the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    
    // Extract mentions from content
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const extractedMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(args.content)) !== null) {
      if (match[2]) {
        extractedMentions.push(match[2]);
      }
    }
    
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

    // Get current user for permission checks
    const currentUserId = await getAuthUserId(ctx);

    return await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const mentionedUsers = await Promise.all(
          comment.mentions.map(async (mentionId) => {
            const mentionedUser = await ctx.db.get(mentionId);
            return {
              id: mentionId,
              name: mentionedUser?.name || mentionedUser?.email || "Unknown",
              email: mentionedUser?.email,
            };
          })
        );

        // Count replies
        const replies = await ctx.db
          .query("comments")
          .withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
          .collect();

        return {
          ...comment,
          userName: user?.name || user?.email || "Unknown",
          userEmail: user?.email,
          mentionedUsers,
          replyCount: replies.length,
          canEdit: currentUserId === comment.userId,
          canDelete: currentUserId === comment.userId,
          isEdited: comment._creationTime !== (comment as any).lastEditedTime,
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
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    
    if (!comment || comment.userId !== userId) {
      throw new Error("Not authorized to edit this comment");
    }

    const updates: any = {
      content: args.content,
      lastEditedTime: Date.now(),
    };
    
    if (args.mentions !== undefined) {
      updates.mentions = args.mentions;
    }

    await ctx.db.patch(args.commentId, updates);
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

    // Delete all replies recursively
    async function deleteCommentAndReplies(commentId: any) {
      const replies = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) => q.eq("parentCommentId", commentId))
        .collect();

      for (const reply of replies) {
        await deleteCommentAndReplies(reply._id);
      }

      await ctx.db.delete(commentId);
    }

    await deleteCommentAndReplies(args.commentId);
  },
});

// Get all users in the document for mentions
export const getDocumentUsers = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) return [];
    
    // Get all unique user IDs from document collaborators and comment authors
    const userIds = new Set<string>([document.createdBy, ...document.collaborators]);
    
    // Get all comment authors
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    
    comments.forEach(comment => userIds.add(comment.userId));
    
    // Get user details
    const users = await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const user = await ctx.db.get(userId as Id<"users">);
        if (!user) return null;
        return {
          id: user._id,
          name: user.name || user.email || "Unknown",
          email: user.email,
        };
      })
    );
    
    return users.filter(Boolean);
  },
});
