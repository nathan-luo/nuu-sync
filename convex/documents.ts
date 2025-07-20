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

export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    
    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      createdBy: userId,
      isPublic: args.isPublic,
      collaborators: [userId],
    });
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const document = await ctx.db.get(args.documentId);
    
    if (!document) {
      return null;
    }

    // Check if user has access
    if (!document.isPublic && userId) {
      const hasAccess = document.collaborators.includes(userId) || 
                       document.createdBy === userId;
      
      if (!hasAccess) {
        const share = await ctx.db
          .query("documentShares")
          .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
          .filter((q) => q.eq(q.field("sharedWith"), userId))
          .first();
        
        if (!share) {
          return null;
        }
      }
    }

    const creator = await ctx.db.get(document.createdBy);
    
    return {
      ...document,
      creatorName: creator?.name || creator?.email || "Unknown",
    };
  },
});

export const getUserDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const ownedDocs = await ctx.db
      .query("documents")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    const sharedDocs = await ctx.db
      .query("documentShares")
      .withIndex("by_shared_with", (q) => q.eq("sharedWith", userId))
      .collect();

    const sharedDocuments = await Promise.all(
      sharedDocs.map(async (share) => {
        const doc = await ctx.db.get(share.documentId);
        if (doc) {
          const creator = await ctx.db.get(doc.createdBy);
          return {
            ...doc,
            creatorName: creator?.name || creator?.email || "Unknown",
            permission: share.permission,
          };
        }
        return null;
      })
    );

    const ownedWithCreator = await Promise.all(
      ownedDocs.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        return {
          ...doc,
          creatorName: creator?.name || creator?.email || "Unknown",
          permission: "edit" as const,
        };
      })
    );

    return [...ownedWithCreator, ...sharedDocuments.filter(Boolean)];
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const document = await ctx.db.get(args.documentId);
    
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.createdBy !== userId && !document.collaborators.includes(userId)) {
      throw new Error("Not authorized to edit this document");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;

    await ctx.db.patch(args.documentId, updates);
  },
});

export const shareDocument = mutation({
  args: {
    documentId: v.id("documents"),
    userEmail: v.string(),
    permission: v.union(v.literal("read"), v.literal("comment"), v.literal("edit")),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const document = await ctx.db.get(args.documentId);
    
    if (!document || document.createdBy !== userId) {
      throw new Error("Not authorized to share this document");
    }

    // Find user by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if already shared
    const existingShare = await ctx.db
      .query("documentShares")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("sharedWith"), targetUser._id))
      .first();

    if (existingShare) {
      await ctx.db.patch(existingShare._id, { permission: args.permission });
    } else {
      await ctx.db.insert("documentShares", {
        documentId: args.documentId,
        sharedBy: userId,
        sharedWith: targetUser._id,
        permission: args.permission,
      });
    }
  },
});

export const getDocumentShares = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const document = await ctx.db.get(args.documentId);
    if (!document || document.createdBy !== userId) {
      return [];
    }

    const shares = await ctx.db
      .query("documentShares")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return await Promise.all(
      shares.map(async (share) => {
        const user = await ctx.db.get(share.sharedWith);
        return {
          _id: share._id,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
          permission: share.permission,
        };
      })
    );
  },
});
