import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Comment {
  _id: Id<"comments">;
  highlightId?: Id<"highlights">;
  parentCommentId?: Id<"comments">;
  userId: Id<"users">;
  content: string;
  userName: string;
  _creationTime: number;
}

interface Highlight {
  _id: Id<"highlights">;
  selectedText: string;
  color: string;
  userName: string;
}

interface CommentSidebarProps {
  documentId: Id<"documents">;
  comments: Comment[];
  highlights: Highlight[];
  selectedHighlight: Id<"highlights"> | null;
  onHighlightSelect: (highlightId: Id<"highlights"> | null) => void;
}

export function CommentSidebar({
  documentId,
  comments,
  highlights,
  selectedHighlight,
  onHighlightSelect,
}: CommentSidebarProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<Id<"comments"> | null>(null);
  const [editContent, setEditContent] = useState("");
  
  const createComment = useMutation(api.comments.createComment);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  // Group comments by highlight
  const commentsByHighlight = comments.reduce((acc, comment) => {
    const key = comment.highlightId || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

  // Get root comments (no parent) for each highlight
  const getRootComments = (highlightId?: Id<"highlights">) => {
    const key = highlightId || 'general';
    return (commentsByHighlight[key] || []).filter(c => !c.parentCommentId);
  };

  // Get replies for a comment
  const getReplies = (commentId: Id<"comments">) => {
    return comments.filter(c => c.parentCommentId === commentId);
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment({
        documentId,
        highlightId: selectedHighlight || undefined,
        content: newComment.trim(),
        mentions: [], // TODO: Parse mentions from content
      });
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    }
  };

  const handleReply = async (parentCommentId: Id<"comments">) => {
    if (!replyContent.trim()) return;

    try {
      const parentComment = comments.find(c => c._id === parentCommentId);
      await createComment({
        documentId,
        parentCommentId,
        highlightId: parentComment?.highlightId,
        content: replyContent.trim(),
        mentions: [], // TODO: Parse mentions from content
      });
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply added!");
    } catch (error) {
      toast.error("Failed to add reply");
      console.error(error);
    }
  };

  const handleEditComment = async (commentId: Id<"comments">) => {
    if (!editContent.trim()) return;

    try {
      await updateComment({
        commentId,
        content: editContent.trim(),
      });
      setEditingComment(null);
      setEditContent("");
      toast.success("Comment updated!");
    } catch (error) {
      toast.error("Failed to update comment");
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: Id<"comments">) => {
    if (!confirm("Are you sure you want to delete this comment and all its replies?")) return;

    try {
      await deleteComment({ commentId });
      toast.success("Comment deleted!");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const CommentThread = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const replies = getReplies(comment._id);
    const isReplying = replyingTo === comment._id;
    const isEditing = editingComment === comment._id;
    const isOwner = loggedInUser?._id === comment.userId;

    return (
      <div className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-4' : ''} mb-4`}>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-sm text-gray-900">{comment.userName}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {new Date(comment._creationTime).toLocaleDateString()}
              </span>
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(comment)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(comment._id)}
                  disabled={!editContent.trim()}
                  className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">{comment.content}</p>
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                {isReplying ? 'Cancel Reply' : 'Reply'}
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 ml-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleReply(comment._id)}
                disabled={!replyContent.trim()}
                className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {replies.map((reply) => (
          <div key={reply._id} className="mt-3">
            <CommentThread comment={reply} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold mb-4 text-gray-900">Comments & Highlights</h3>

        {/* New comment form */}
        <div className="mb-6">
          {selectedHighlight && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <div className="font-medium mb-1 text-gray-900">Commenting on highlight:</div>
              <div className="text-gray-700 italic">
                "{highlights.find(h => h._id === selectedHighlight)?.selectedText}"
              </div>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={selectedHighlight ? "Comment on this highlight..." : "Add a general comment..."}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            {selectedHighlight && (
              <button
                onClick={() => onHighlightSelect(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            )}
            <button
              onClick={handleCreateComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 ml-auto"
            >
              Comment
            </button>
          </div>
        </div>

        {/* Highlights with comments */}
        <div className="space-y-6">
          {highlights.map((highlight) => {
            const highlightComments = getRootComments(highlight._id);
            const isSelected = selectedHighlight === highlight._id;
            
            return (
              <div key={highlight._id} className={`border rounded-lg p-4 transition-all ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                <div
                  className="cursor-pointer"
                  onClick={() => onHighlightSelect(isSelected ? null : highlight._id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <span className="text-xs text-gray-500">by {highlight.userName}</span>
                  </div>
                  <div className="text-sm font-medium mb-3 text-gray-900">
                    "{highlight.selectedText}"
                  </div>
                </div>
                
                {highlightComments.length > 0 && (
                  <div className="space-y-3">
                    {highlightComments.map((comment) => (
                      <CommentThread key={comment._id} comment={comment} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* General comments (not tied to highlights) */}
          {getRootComments().length > 0 && (
            <div className="border rounded-lg p-4 border-gray-200">
              <h4 className="font-medium mb-3 text-sm text-gray-900">General Comments</h4>
              <div className="space-y-3">
                {getRootComments().map((comment) => (
                  <CommentThread key={comment._id} comment={comment} />
                ))}
              </div>
            </div>
          )}
        </div>

        {highlights.length === 0 && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No highlights or comments yet.</p>
            <p className="text-xs mt-1">Select text to create highlights with comments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
