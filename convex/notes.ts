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

export const createNote = mutation({
  args: {
    documentId: v.id("documents"),
    highlightId: v.optional(v.id("highlights")),
    title: v.string(),
    content: v.string(),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    
    return await ctx.db.insert("notes", {
      documentId: args.documentId,
      highlightId: args.highlightId,
      userId,
      title: args.title,
      content: args.content,
      isPrivate: args.isPrivate,
    });
  },
});

export const getUserNotes = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("notes")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const getPublicNotes = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isPrivate"), false))
      .collect();

    return await Promise.all(
      notes.map(async (note) => {
        const user = await ctx.db.get(note.userId);
        return {
          ...note,
          userName: user?.name || user?.email || "Unknown",
        };
      })
    );
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const note = await ctx.db.get(args.noteId);
    
    if (!note || note.userId !== userId) {
      throw new Error("Not authorized to edit this note");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;

    await ctx.db.patch(args.noteId, updates);
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getLoggedInUser(ctx);
    const note = await ctx.db.get(args.noteId);
    
    if (!note || note.userId !== userId) {
      throw new Error("Not authorized to delete this note");
    }

    await ctx.db.delete(args.noteId);
  },
});
