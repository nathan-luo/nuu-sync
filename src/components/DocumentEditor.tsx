"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface DocumentEditorProps {
  documentId: Id<"documents">;
  initialTitle: string;
  initialContent: string;
  onClose: () => void;
}

export function DocumentEditor({ 
  documentId, 
  initialTitle, 
  initialContent, 
  onClose 
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const updateDocument = useMutation(api.documents.updateDocument);
  
  // Auto-resize textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
    }
  }, [content]);
  
  // Track changes
  useEffect(() => {
    const changed = title !== initialTitle || content !== initialContent;
    setHasChanges(changed);
  }, [title, content, initialTitle, initialContent]);
  
  // Auto-save
  useEffect(() => {
    if (!hasChanges) return;
    
    const timeoutId = setTimeout(() => void (async () => {
      setIsSaving(true);
      try {
        await updateDocument({
          documentId,
          title,
          content,
        });
        toast.success("Auto-saved");
      } catch {
        toast.error("Failed to auto-save");
      } finally {
        setIsSaving(false);
      }
    })(), 2000); // Save after 2 seconds of inactivity
    
    return () => clearTimeout(timeoutId);
  }, [title, content, hasChanges, documentId, updateDocument]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDocument({
        documentId,
        title,
        content,
      });
      toast.success("Document saved!");
      onClose();
    } catch {
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    onClose();
  };
  
  // Simple markdown preview
  const renderPreview = (text: string) => {
    const html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1rem 0;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 600; margin: 1rem 0;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.875rem; font-weight: 700; margin: 1rem 0;">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.+?)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #000; text-decoration: underline;">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
      
    return html;
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="text-2xl font-bold outline-none"
            />
            {isSaving && (
              <span className="text-sm text-gray-500 animate-pulse">Saving...</span>
            )}
            {hasChanges && !isSaving && (
              <span className="text-sm text-gray-500">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                preview 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {preview ? (
          <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div 
                className="prose prose-lg"
                dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Editor */}
            <div className="flex-1 p-6 overflow-auto">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing in markdown..."
                className="w-full min-h-full outline-none resize-none text-lg leading-relaxed font-mono"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              />
            </div>
            
            {/* Markdown help sidebar */}
            <div className="w-64 border-l border-gray-200 p-4 overflow-auto bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Markdown Help</h3>
              <div className="space-y-3 text-xs text-gray-600">
                <div>
                  <div className="font-medium text-gray-700"># Heading 1</div>
                  <div>## Heading 2</div>
                  <div>### Heading 3</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">**bold text**</div>
                  <div>*italic text*</div>
                  <div>`code`</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">[link text](url)</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Lists:</div>
                  <div>* Item 1</div>
                  <div>* Item 2</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Quotes:</div>
                  <div>&gt; Quoted text</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}