import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  documents: defineTable({
    title: v.string(),
    content: v.string(), // markdown content
    createdBy: v.id("users"),
    isPublic: v.boolean(),
    collaborators: v.array(v.id("users")),
  })
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"]),

  highlights: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    startOffset: v.number(),
    endOffset: v.number(),
    selectedText: v.string(),
    color: v.string(), // hex color for highlight
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    documentId: v.id("documents"),
    highlightId: v.optional(v.id("highlights")),
    parentCommentId: v.optional(v.id("comments")), // for branching
    userId: v.id("users"),
    content: v.string(),
    mentions: v.array(v.id("users")),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })), // for positioning branched comments
  })
    .index("by_document", ["documentId"])
    .index("by_highlight", ["highlightId"])
    .index("by_parent", ["parentCommentId"])
    .index("by_user", ["userId"]),

  notes: defineTable({
    documentId: v.id("documents"),
    highlightId: v.optional(v.id("highlights")),
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    isPrivate: v.boolean(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_highlight", ["highlightId"]),

  documentShares: defineTable({
    documentId: v.id("documents"),
    sharedBy: v.id("users"),
    sharedWith: v.id("users"),
    permission: v.union(v.literal("read"), v.literal("comment"), v.literal("edit")),
  })
    .index("by_document", ["documentId"])
    .index("by_shared_with", ["sharedWith"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
