"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ShareModalProps {
  documentId: Id<"documents">;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type Permission = "read" | "comment" | "edit";

export function ShareModal({ documentId, documentTitle, isOpen, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<Permission>("read");
  const [isSharing, setIsSharing] = useState(false);
  
  const shareDocument = useMutation(api.documents.shareDocument);
  const shares = useQuery(api.documents.getDocumentShares, { documentId });
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSharing(true);
    try {
      await shareDocument({
        documentId,
        userEmail: email.trim(),
        permission,
      });
      toast.success(`Document shared with ${email}`);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to share document");
    } finally {
      setIsSharing(false);
    }
  };

  const getShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/document/${documentId}`;
  };

  const copyShareLink = () => {
    void navigator.clipboard.writeText(getShareLink());
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Document</h2>
              <p className="text-sm text-gray-600 mt-1">{documentTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Share with email */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  onKeyDown={(e) => e.key === 'Enter' && void handleShare()}
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as Permission)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="read">Can read</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>
              <button
                onClick={() => void handleShare()}
                disabled={isSharing || !email.trim()}
                className="w-full mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? "Sharing..." : "Share"}
              </button>
            </div>

            {/* Copy link */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or share with link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareLink()}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                />
                <button
                  onClick={() => void copyShareLink()}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Current shares */}
            {shares && shares.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">People with access</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Document creator */}
                  {currentUser && (
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                        <div className="text-xs text-gray-500">{currentUser.email} (Owner)</div>
                      </div>
                      <span className="text-xs text-gray-500">Owner</span>
                    </div>
                  )}
                  {/* Shared users */}
                  {shares.map((share) => (
                    <div key={share._id} className="flex justify-between items-center py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{share.userName}</div>
                        <div className="text-xs text-gray-500">{share.userEmail}</div>
                      </div>
                      <span className="text-xs text-gray-500">
                        Can {share.permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}