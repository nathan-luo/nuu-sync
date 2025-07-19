"use client";
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
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  const ownDocuments = documents.filter(doc => doc && doc.permission === "edit");
  const sharedDocuments = documents.filter(doc => doc && doc.permission !== "edit");

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Document Library</h2>
            <p className="text-gray-600">Read, highlight, and discuss documents collaboratively</p>
          </div>
          <button
            onClick={onCreateNew}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>
        
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Create your first document to start highlighting and discussing ideas with your team</p>
          <button
            onClick={onCreateNew}
            className="btn-primary"
          >
            Create Your First Document
          </button>
        </div>
      ) : (
        <>
          {/* Your Documents */}
          {ownDocuments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => onOpenDocument(doc._id)}
                    className="card card-hover p-6 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold group-hover:text-black transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <div className="flex gap-1">
                        {doc.isPublic && (
                          <span className="badge badge-primary">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p className="line-clamp-3">
                        {doc.content.substring(0, 200)}
                        {doc.content.length > 200 && "..."}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(doc._creationTime).toLocaleDateString()}
                      </span>
                      <span className="text-black opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Documents */}
          {sharedDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Shared with You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => onOpenDocument(doc._id)}
                    className="card card-hover p-6 cursor-pointer group border-l-4 border-black"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold group-hover:text-black transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <div className="flex gap-1">
                        {doc.permission === "read" && (
                          <span className="badge badge-secondary">
                            Read
                          </span>
                        )}
                        {doc.permission === "comment" && (
                          <span className="badge badge-warning">
                            Comment
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p className="line-clamp-3">
                        {doc.content.substring(0, 200)}
                        {doc.content.length > 200 && "..."}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>by {doc.creatorName}</span>
                      <span className="text-black opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
