import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CommentSidebar } from "./CommentSidebar";
import { useState } from "react";

interface DocumentViewerProps {
  documentId: Id<"documents">;
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const document = useQuery(api.documents.getDocument, { documentId });
  const highlights = useQuery(api.highlights.getDocumentHighlights, { documentId });
  const comments = useQuery(api.comments.getDocumentComments, { documentId });
  const [selectedHighlight, setSelectedHighlight] = useState<Id<"highlights"> | null>(null);
  const [showComments, setShowComments] = useState(true);

  if (document === undefined || highlights === undefined || comments === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
          <p className="text-gray-500">This document doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content area */}
      <div className={`flex-1 overflow-auto ${showComments ? 'mr-96' : ''} transition-all duration-300`}>
        <div className="max-w-4xl mx-auto p-6">
          {/* Document header */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-black">{document.title}</h1>
                <p className="text-gray-600">by {document.creatorName}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {showComments ? 'Hide' : 'Show'} Comments
                </button>
                {document.isPublic && (
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-600 font-medium">
                    Public
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created {new Date(document._creationTime).toLocaleDateString()}
              {highlights.length > 0 && (
                <span className="ml-4">
                  • {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
                </span>
              )}
              {comments.length > 0 && (
                <span className="ml-2">
                  • {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Document content */}
          <MarkdownRenderer
            content={document.content}
            documentId={documentId}
            highlights={highlights}
            onHighlightSelect={setSelectedHighlight}
            selectedHighlight={selectedHighlight}
          />
        </div>
      </div>

      {/* Comments sidebar */}
      {showComments && (
        <CommentSidebar
          documentId={documentId}
          comments={comments}
          highlights={highlights}
          selectedHighlight={selectedHighlight}
          onHighlightSelect={setSelectedHighlight}
        />
      )}
    </div>
  );
}
