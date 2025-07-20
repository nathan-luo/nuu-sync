"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Highlight {
  _id: Id<"highlights">;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  color: string;
  userName: string;
}

interface HighlightOverlayProps {
  highlights: Highlight[];
  contentRef: React.RefObject<HTMLDivElement>;
  onHighlightClick: (highlightId: Id<"highlights">) => void;
  onHighlightDelete?: (highlightId: Id<"highlights">) => void;
  selectedHighlight: Id<"highlights"> | null;
}

interface HighlightRect {
  highlightId: Id<"highlights">;
  rect: DOMRect;
  color: string;
}

export function HighlightOverlay({
  highlights,
  contentRef,
  onHighlightClick,
  onHighlightDelete,
  selectedHighlight,
}: HighlightOverlayProps) {
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Function to get text nodes from an element
  const getTextNodes = useCallback((node: Node): Node[] => {
    const textNodes: Node[] = [];
    
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else {
      for (const child of Array.from(node.childNodes)) {
        textNodes.push(...getTextNodes(child));
      }
    }
    
    return textNodes;
  }, []);

  // Function to find range for a highlight based on character offsets
  const findRangeForHighlight = (highlight: Highlight, textNodes: Node[]): Range | null => {
    let currentOffset = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startNodeOffset = 0;
    let endNodeOffset = 0;

    for (const node of textNodes) {
      const nodeLength = node.textContent?.length || 0;
      const nodeEndOffset = currentOffset + nodeLength;

      // Find start node
      if (startNode === null && currentOffset <= highlight.startOffset && highlight.startOffset < nodeEndOffset) {
        startNode = node;
        startNodeOffset = highlight.startOffset - currentOffset;
      }

      // Find end node
      if (currentOffset < highlight.endOffset && highlight.endOffset <= nodeEndOffset) {
        endNode = node;
        endNodeOffset = highlight.endOffset - currentOffset;
        break;
      }

      currentOffset = nodeEndOffset;
    }

    if (!startNode || !endNode) return null;

    try {
      const range = document.createRange();
      range.setStart(startNode, startNodeOffset);
      range.setEnd(endNode, endNodeOffset);
      return range;
    } catch (error) {
      console.error("Error creating range:", error);
      return null;
    }
  };

  // Calculate highlight positions
  const calculateHighlightRects = useCallback(() => {
    if (!contentRef.current) return;

    const textNodes = getTextNodes(contentRef.current);
    const rects: HighlightRect[] = [];

    for (const highlight of highlights) {
      const range = findRangeForHighlight(highlight, textNodes);
      if (!range) continue;

      // Get all client rects for the range (handles multi-line selections)
      const clientRects = range.getClientRects();
      const contentRect = contentRef.current.getBoundingClientRect();

      for (const rect of Array.from(clientRects)) {
        // Convert to relative position within the content container
        const relativeRect = new DOMRect(
          rect.left - contentRect.left,
          rect.top - contentRect.top,
          rect.width,
          rect.height
        );

        rects.push({
          highlightId: highlight._id,
          rect: relativeRect,
          color: highlight.color,
        });
      }
    }

    setHighlightRects(rects);
  }, [highlights, contentRef, getTextNodes]);

  // Recalculate positions when content or highlights change
  useEffect(() => {
    calculateHighlightRects();

    // Add resize observer to recalculate on content size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateHighlightRects();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Recalculate on window resize
    const handleResize = () => calculateHighlightRects();
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [highlights, contentRef, calculateHighlightRects]);

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {highlightRects.map((hr, index) => {
        const isSelected = selectedHighlight === hr.highlightId;
        return (
          <div
            key={`${hr.highlightId}-${index}`}
            className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
              isSelected ? 'ring-2 ring-black ring-offset-1' : ''
            }`}
            title="Click to view comments • Right-click to delete"
            style={{
              left: `${hr.rect.left}px`,
              top: `${hr.rect.top}px`,
              width: `${hr.rect.width}px`,
              height: `${hr.rect.height}px`,
              backgroundColor: hr.color,
              opacity: isSelected ? 0.5 : 0.3,
              mixBlendMode: 'multiply',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onHighlightClick(hr.highlightId);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onHighlightDelete) {
                void onHighlightDelete(hr.highlightId);
              }
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = '0.5';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = isSelected ? '0.5' : '0.3';
            }}
          />
        );
      })}
    </div>
  );
}