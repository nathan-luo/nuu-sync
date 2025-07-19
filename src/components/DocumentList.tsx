import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DocumentListProps {
  onCreateNew: () => void;
  onOpenDocument: (documentId: Id<"documents">) => void;
}

export function DocumentList({ onCreateNew, onOpenDocument }: DocumentListProps) {
  const documents = useQuery(api.documents.getUserDocuments);

  if (documents === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Documents</h2>
          <p className="text-gray-600">Collaborative reading and annotation workspace</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
        >
          + New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6">Create your first document to start collaborative reading</p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium"
          >
            Create Document
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.filter(doc => doc !== null).map((doc) => (
            <div
              key={doc._id}
              onClick={() => onOpenDocument(doc._id)}
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 cursor-pointer transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold group-hover:text-gray-700 transition-colors">
                  {doc.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {doc.permission && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {doc.permission}
                    </span>
                  )}
                  {doc.isPublic && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Public
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p className="line-clamp-2">
                  {doc.content.substring(0, 150)}
                  {doc.content.length > 150 && "..."}
                </p>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>by {doc.creatorName}</span>
                <span>{new Date(doc._creationTime).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
