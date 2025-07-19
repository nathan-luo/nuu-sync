import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CreateDocumentProps {
  onBack: () => void;
}

export function CreateDocument({ onBack }: CreateDocumentProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const createDocument = useMutation(api.documents.createDocument);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    setIsLoading(true);
    try {
      await createDocument({
        title: title.trim(),
        content: content.trim(),
        isPublic,
      });
      toast.success("Document created successfully!");
      onBack();
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create New Document</h2>
        <p className="text-gray-600">Create a markdown document for collaborative reading</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-shadow"
            placeholder="Enter document title..."
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-shadow font-mono text-sm"
            placeholder={exampleMarkdown}
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Use Markdown syntax for formatting. This content will be rendered and available for highlighting and comments.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make this document public (anyone can view and comment)
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Document"}
          </button>
        </div>
      </form>
    </div>
  );
}
