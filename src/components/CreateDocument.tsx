"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateDocumentProps {
  onBack: () => void;
}

export function CreateDocument({ onBack }: CreateDocumentProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createDocument = useMutation(api.documents.createDocument);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    setIsLoading(true);
    try {
      const documentId = await createDocument({
        title: title.trim(),
        content: content.trim(),
        isPublic,
      });
      toast.success("Document created successfully!");
      router.push(`/document/${documentId}`);
    } catch (error) {
      toast.error("Failed to create document");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleMarkdown = `# Sample Document

This is an example of how your markdown content will be rendered. You can use:

## Headings
### Subheadings

**Bold text** and *italic text*

- Bullet points
- Another point
  - Nested points

1. Numbered lists
2. Second item

> Blockquotes for important information

\`\`\`javascript
// Code blocks
function example() {
  return "Hello, NUU Sync!";
}
\`\`\`

[Links](https://example.com) and more formatting options are supported.

Replace this content with your own markdown document.`;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Create New Document</h2>
        <p className="text-gray-600">Write or paste your content in markdown format for collaborative deep reading</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="card p-6">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
            placeholder="Enter a descriptive title for your document..."
            required
          />
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700">
              Content (Markdown)
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setContent(exampleMarkdown)}
                className="text-black hover:underline font-medium text-xs"
              >
                Use Example
              </button>
            </div>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-mono text-sm"
            placeholder={exampleMarkdown}
            required
          />
          <div className="mt-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500">
              Your content will be rendered with full markdown support. Users can highlight text and add comments to create branching discussions.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded mt-0.5"
            />
            <div>
              <label htmlFor="isPublic" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Make this document public
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Public documents can be viewed and commented on by anyone with the link
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !content.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Create Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
