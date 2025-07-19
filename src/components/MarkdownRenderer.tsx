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
  const [selectedColor, setSelectedColor] = useState("#ffeb3b");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  
  const createHighlightWithComment = useMutation(api.highlights.createHighlightWithComment);

  // Simple markdown to HTML conversion
  const renderMarkdown = (text: string) => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3 text-black">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-black">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-6 text-black">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-black">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-black underline hover:text-gray-700">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700">$1</blockquote>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="mb-1">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1">$2</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
      .replace(/^/, '<p class="mb-4 leading-relaxed">')
      .replace(/$/, '</p>')
      // Line breaks
      .replace(/\n/g, '<br>');
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
    const startOffset = getTextOffset(range.startContainer, range.startOffset);
    const endOffset = getTextOffset(range.endContainer, range.endOffset);

    if (startOffset !== -1 && endOffset !== -1) {
      setSelectedText(text);
      setSelectionRange({ start: startOffset, end: endOffset });
      
      // Position the highlight menu
      const rect = range.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowHighlightMenu(true);
    }
  };

  const getTextOffset = (node: Node, offset: number): number => {
    if (!contentRef.current) return -1;
    
    let textOffset = 0;
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }
    
    return -1;
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setShowHighlightMenu(false);
    setShowCommentDialog(true);
  };

  const handleCreateHighlight = async () => {
    if (!selectionRange || !selectedText || !commentContent.trim()) return;

    try {
      await createHighlightWithComment({
        documentId,
        startOffset: selectionRange.start,
        endOffset: selectionRange.end,
        selectedText,
        color: selectedColor,
        commentContent: commentContent.trim(),
      });
      toast.success("Highlight and comment created!");
      setShowCommentDialog(false);
      setCommentContent("");
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast.error("Failed to create highlight");
      console.error(error);
    }
  };

  const cancelHighlight = () => {
    setShowHighlightMenu(false);
    setShowCommentDialog(false);
    setCommentContent("");
    window.getSelection()?.removeAllRanges();
  };

  // Apply highlights to rendered content
  const applyHighlights = (html: string) => {
    if (highlights.length === 0) return html;

    // Sort highlights by start position (descending) to avoid offset issues
    const sortedHighlights = [...highlights].sort((a, b) => b.startOffset - a.startOffset);
    
    let result = html;
    
    sortedHighlights.forEach((highlight) => {
      const isSelected = selectedHighlight === highlight._id;
      const highlightClass = `highlight-${highlight._id} cursor-pointer px-1 rounded transition-all ${
        isSelected ? 'ring-2 ring-black' : ''
      }`;
      
      // Simple text replacement for highlights (this is a basic implementation)
      const highlightedText = `<span class="${highlightClass}" style="background-color: ${highlight.color}60" data-highlight-id="${highlight._id}" title="Highlighted by ${highlight.userName}: Click to view comments">${highlight.selectedText}</span>`;
      
      // Replace the first occurrence of the selected text
      const index = result.indexOf(highlight.selectedText);
      if (index !== -1) {
        result = result.substring(0, index) + highlightedText + result.substring(index + highlight.selectedText.length);
      }
    });
    
    return result;
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

  const renderedContent = applyHighlights(renderMarkdown(content));

  const highlightColors = [
    { color: '#ffeb3b', name: 'Yellow' },
    { color: '#4caf50', name: 'Green' },
    { color: '#2196f3', name: 'Blue' },
    { color: '#ff9800', name: 'Orange' },
    { color: '#e91e63', name: 'Pink' },
  ];

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none leading-relaxed text-gray-900"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
        onMouseUp={handleTextSelection}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const highlightId = target.getAttribute('data-highlight-id');
          if (highlightId) {
            onHighlightSelect(highlightId as Id<"highlights">);
          }
        }}
      />

      {/* Highlight color selection menu */}
      {showHighlightMenu && (
        <div
          className="highlight-menu fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            left: menuPosition.x - 120,
            top: menuPosition.y - 70,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-gray-600 mb-3 text-center font-medium">Choose highlight color</div>
          <div className="flex gap-2 justify-center">
            {highlightColors.map(({ color, name }) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors hover:scale-110"
                style={{ backgroundColor: color + '80' }}
                title={name}
              />
            ))}
          </div>
          <button
            onClick={cancelHighlight}
            className="w-full mt-3 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Comment dialog */}
      {showCommentDialog && (
        <div
          className="comment-dialog fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80"
          style={{
            left: Math.min(menuPosition.x - 160, window.innerWidth - 320),
            top: menuPosition.y + 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3">
            <div className="text-sm font-medium mb-2">Add a comment to your highlight:</div>
            <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded border">
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
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: selectedColor + '80' }}
              />
              <span className="text-xs text-gray-500">
                {highlightColors.find(c => c.color === selectedColor)?.name}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelHighlight}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHighlight}
                disabled={!commentContent.trim()}
                className="px-3 py-1 text-xs bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Highlight & Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
