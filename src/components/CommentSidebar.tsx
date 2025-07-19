import { useState, useRef, useEffect } from "react";
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
  userEmail?: string;
  _creationTime: number;
  mentionedUsers?: { id: string; name: string; email?: string }[];
  replyCount?: number;
  canEdit?: boolean;
  canDelete?: boolean;
  isEdited?: boolean;
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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const createComment = useMutation(api.comments.createComment);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const documentUsers = useQuery(api.comments.getDocumentUsers, { documentId });

  // Filter users for mentions
  const filteredUsers = documentUsers?.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  ) || [];

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

  // Parse mentions from content to get user IDs
  const parseMentions = (content: string): Id<"users">[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: Id<"users">[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[2]) {
        mentions.push(match[2] as Id<"users">);
      }
    }
    return mentions;
  };

  // Handle mention selection
  const insertMention = (user: { id: string; name: string }, textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    const value = textarea.value;
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = value.substring(0, lastAtIndex);
      const afterAt = value.substring(lastAtIndex + mentionSearch.length + 1);
      const newValue = `${beforeAt}@[${user.name}](${user.id})${afterAt}`;
      
      if (textarea === textareaRef.current) {
        setNewComment(newValue);
      } else {
        setReplyContent(newValue);
      }
    }
    
    setShowMentions(false);
    setMentionSearch("");
    textarea.focus();
  };

  // Handle text input for mentions
  const handleTextChange = (value: string, isReply = false) => {
    if (isReply) {
      setReplyContent(value);
    } else {
      setNewComment(value);
    }
    
    // Check for @ symbol
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1 || 
        (lastAtIndex !== -1 && value.substring(lastAtIndex + 1).match(/^[a-zA-Z0-9]*$/))) {
      setShowMentions(true);
      setMentionSearch(value.substring(lastAtIndex + 1));
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isReply = false) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const textarea = isReply ? replyTextareaRef.current : textareaRef.current;
        insertMention(filteredUsers[selectedMentionIndex], textarea);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        setMentionSearch("");
      }
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment({
        documentId,
        highlightId: selectedHighlight || undefined,
        content: newComment.trim(),
        mentions: parseMentions(newComment),
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
        mentions: parseMentions(replyContent),
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
        mentions: parseMentions(editContent),
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
    if (!confirm("Delete this comment and all its replies?")) return;

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

  // Render content with mentions as clickable links
  const renderContentWithMentions = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Add mention as a styled span
      parts.push(
        <span key={match.index} className="mention">
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  // Mentions dropdown component
  const MentionsDropdown = ({ isReply = false }: { isReply?: boolean }) => {
    if (!showMentions || filteredUsers.length === 0) return null;

    return (
      <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
        {filteredUsers.map((user, index) => (
          <button
            key={user.id}
            onClick={() => {
              const textarea = isReply ? replyTextareaRef.current : textareaRef.current;
              insertMention(user, textarea);
            }}
            onMouseEnter={() => setSelectedMentionIndex(index)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
              index === selectedMentionIndex ? 'bg-gray-50' : ''
            }`}
          >
            <div className="avatar avatar-sm">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user.name}</div>
              {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const CommentThread = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const replies = getReplies(comment._id);
    const isReplying = replyingTo === comment._id;
    const isEditing = editingComment === comment._id;

    return (
      <div className={`${depth > 0 ? 'ml-6 relative before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-px before:bg-gray-200' : ''}`}>
        <div className="comment-bubble mb-3">
          <div className="flex items-start gap-3">
            <div className="avatar avatar-sm flex-shrink-0">
              {comment.userName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{comment.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment._creationTime).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>
                {comment.canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(comment)}
                      className="btn-icon p-1"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="btn-icon p-1 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      disabled={!editContent.trim()}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn-ghost text-xs px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {renderContentWithMentions(comment.content)}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                    {comment.replyCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isReplying && (
          <div className="mb-4 ml-11 relative">
            <textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => handleTextChange(e.target.value, true)}
              onKeyDown={(e) => handleKeyDown(e, true)}
              placeholder="Write a reply..."
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              rows={3}
              autoFocus
            />
            <MentionsDropdown isReply />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleReply(comment._id)}
                disabled={!replyContent.trim()}
                className="btn-primary text-xs px-3 py-1"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                className="btn-ghost text-xs px-3 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {replies.map((reply) => (
          <CommentThread key={reply._id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-xl overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100">
        <h3 className="font-semibold text-lg text-gray-900">Discussion</h3>
        <p className="text-xs text-gray-500 mt-1">
          {comments.length} comments · {highlights.length} highlights
        </p>
      </div>

      <div className="p-4">
        {/* New comment form */}
        <div className="mb-6">
          {selectedHighlight && (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-gray-700">Commenting on highlight</span>
                <button
                  onClick={() => onHighlightSelect(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-700 italic line-clamp-2">
                "{highlights.find(h => h._id === selectedHighlight)?.selectedText}"
              </div>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedHighlight ? "Comment on this highlight..." : "Start a discussion..."}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              rows={3}
            />
            <MentionsDropdown />
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-gray-500">
              Use @ to mention users
            </div>
            <button
              onClick={handleCreateComment}
              disabled={!newComment.trim()}
              className="btn-primary text-sm"
            >
              Comment
            </button>
          </div>
        </div>

        {/* Highlights with comments */}
        <div className="space-y-4">
          {highlights.map((highlight) => {
            const highlightComments = getRootComments(highlight._id);
            const isSelected = selectedHighlight === highlight._id;
            
            return (
              <div key={highlight._id} className={`card ${isSelected ? 'ring-2 ring-blue-500' : ''} p-4 transition-all cursor-pointer group`}>
                <div
                  onClick={() => onHighlightSelect(isSelected ? null : highlight._id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <span className="text-xs text-gray-600 font-medium">{highlight.userName}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                    "{highlight.selectedText}"
                  </div>
                </div>
                
                {highlightComments.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    {highlightComments.map((comment) => (
                      <CommentThread key={comment._id} comment={comment} />
                    ))}
                  </div>
                )}
                
                {highlightComments.length === 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Click to comment on this highlight
                  </div>
                )}
              </div>
            );
          })}

          {/* General comments (not tied to highlights) */}
          {getRootComments().length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium mb-3 text-sm text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                General Discussion
              </h4>
              <div className="space-y-2">
                {getRootComments().map((comment) => (
                  <CommentThread key={comment._id} comment={comment} />
                ))}
              </div>
            </div>
          )}
        </div>

        {highlights.length === 0 && comments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No discussions yet</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Select text in the document to highlight it, or start a general discussion above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}