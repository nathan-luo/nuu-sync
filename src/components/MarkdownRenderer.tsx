import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Highlight {
  _id: Id<"highlights">;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  color: string;
  userName: string;
}

interface MarkdownRendererProps {
  content: string;
  documentId: Id<"documents">;
  highlights: Highlight[];
  onHighlightSelect: (highlightId: Id<"highlights"> | null) => void;
  selectedHighlight: Id<"highlights"> | null;
}

export function MarkdownRenderer({
  content,
  documentId,
  highlights,
  onHighlightSelect,
  selectedHighlight,
}: MarkdownRendererProps) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  
  const createHighlightWithComment = useMutation(api.highlights.createHighlightWithComment);
  const deleteHighlight = useMutation(api.highlights.deleteHighlight);

  // Simple markdown to HTML conversion - ultra simple version to avoid white screen
  const renderMarkdown = (text: string) => {
    // Split into lines for processing
    const lines = text.split('\n');
    const htmlLines: string[] = [];
    let inList = false;
    
    for (const line of lines) {
      let processedLine = line;
      
      // Headers
      if (line.startsWith('### ')) {
        processedLine = `<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0;">${line.substring(4)}</h3>`;
      } else if (line.startsWith('## ')) {
        processedLine = `<h2 style="font-size: 1.5rem; font-weight: 600; margin: 1rem 0;">${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        processedLine = `<h1 style="font-size: 1.875rem; font-weight: 700; margin: 1rem 0;">${line.substring(2)}</h1>`;
      }
      // Lists
      else if (line.startsWith('* ')) {
        if (!inList) {
          htmlLines.push('<ul style="list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0;">');
          inList = true;
        }
        processedLine = `<li>${line.substring(2)}</li>`;
      }
      // End list if needed
      else if (inList && !line.startsWith('* ')) {
        htmlLines.push('</ul>');
        inList = false;
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        processedLine = `<blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0;">${line.substring(2)}</blockquote>`;
      }
      // Empty lines become breaks
      else if (line.trim() === '') {
        processedLine = '<br>';
      }
      // Regular paragraphs
      else {
        processedLine = `<p style="margin: 0.5rem 0;">${line}</p>`;
      }
      
      // Inline formatting
      processedLine = processedLine
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #000; text-decoration: underline;">$1</a>');
      
      htmlLines.push(processedLine);
    }
    
    // Close list if still open
    if (inList) {
      htmlLines.push('</ul>');
    }
    
    return htmlLines.join('\n');
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (text.length === 0) {
      setShowHighlightMenu(false);
      return;
    }

    // Calculate text offsets in the original content
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(contentRef.current!);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    setSelectedText(text);
    setSelectionRange({ start, end });
    
    // Position the highlight menu
    const rect = range.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowHighlightMenu(true);
  };

  const handleCreateHighlight = async () => {
    if (!selectionRange || !selectedText || !commentContent.trim()) return;

    try {
      await createHighlightWithComment({
        documentId,
        startOffset: selectionRange.start,
        endOffset: selectionRange.end,
        selectedText,
        color: "#ffeb3b",
        commentContent: commentContent.trim(),
      });
      toast.success("Highlight created!");
      setShowCommentDialog(false);
      setCommentContent("");
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast.error("Failed to create highlight");
      console.error(error);
    }
  };

  const handleDeleteHighlight = async (highlightId: Id<"highlights">) => {
    if (!confirm("Delete this highlight and all its comments?")) return;
    
    try {
      await deleteHighlight({ highlightId });
      toast.success("Highlight deleted!");
    } catch (error) {
      toast.error("Failed to delete highlight");
      console.error(error);
    }
  };

  const cancelHighlight = () => {
    setShowHighlightMenu(false);
    setShowCommentDialog(false);
    setCommentContent("");
    window.getSelection()?.removeAllRanges();
  };

  // Apply highlights to rendered content - simplified version
  const applyHighlights = (html: string) => {
    // For now, return HTML without highlights to fix white screen
    // TODO: Implement proper highlight rendering
    return html;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-menu') && !target.closest('.comment-dialog')) {
        setShowHighlightMenu(false);
        setShowCommentDialog(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const renderedContent = renderMarkdown(content);

  return (
    <div className="relative">
      <div 
        className="markdown-content"
        style={{ position: 'relative', width: '100%', backgroundColor: 'white' }}
      >
        <div
          ref={contentRef}
          className="max-w-none leading-relaxed text-gray-900"
          style={{ minHeight: '100px', padding: '1rem' }}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          onMouseUp={handleTextSelection}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const highlightId = target.getAttribute('data-highlight-id');
          if (highlightId) {
            onHighlightSelect(highlightId as Id<"highlights">);
          }
        }}
        onContextMenu={(e) => {
          const target = e.target as HTMLElement;
          const highlightId = target.getAttribute('data-highlight-id');
          if (highlightId) {
            e.preventDefault();
            handleDeleteHighlight(highlightId as Id<"highlights">);
          }
        }}
      />
      </div>

      {/* Highlight menu */}
      {showHighlightMenu && (
        <div
          className="highlight-menu fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
          style={{
            left: menuPosition.x - 100,
            top: menuPosition.y - 80,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium mb-3">Add highlight</div>
          <button
            onClick={() => {
              setShowHighlightMenu(false);
              setShowCommentDialog(true);
            }}
            className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
          >
            Highlight & Comment
          </button>
          <button
            onClick={cancelHighlight}
            className="w-full mt-2 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Comment dialog */}
      {showCommentDialog && (
        <div
          className="comment-dialog fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-5 w-80"
          style={{
            left: Math.min(menuPosition.x - 160, window.innerWidth - 320),
            top: menuPosition.y + 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Add a comment to your highlight:</div>
            <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded border italic">
              "{selectedText}"
            </div>
          </div>
          
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="What do you think about this text?"
            className="w-full p-3 border border-gray-300 rounded resize-none text-sm"
            rows={3}
            autoFocus
          />
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={cancelHighlight}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateHighlight}
              disabled={!commentContent.trim()}
              className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}