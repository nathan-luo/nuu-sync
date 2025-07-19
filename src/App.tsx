import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DocumentList } from "./components/DocumentList";
import { DocumentViewer } from "./components/DocumentViewer";
import { CreateDocument } from "./components/CreateDocument";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [currentView, setCurrentView] = useState<"list" | "create" | "document">("list");
  const [currentDocumentId, setCurrentDocumentId] = useState<Id<"documents"> | null>(null);

  const openDocument = (documentId: Id<"documents">) => {
    setCurrentDocumentId(documentId);
    setCurrentView("document");
  };

  const goBack = () => {
    setCurrentView("list");
    setCurrentDocumentId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16 flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">NUU Sync</h1>
          <span className="text-sm text-gray-500">by NUU Cognition</span>
        </div>
        <Authenticated>
          <div className="flex items-center gap-4">
            {currentView !== "list" && (
              <button
                onClick={goBack}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                ← Back to Documents
              </button>
            )}
            <SignOutButton />
          </div>
        </Authenticated>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md mx-auto p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Welcome to NUU Sync</h2>
                <p className="text-gray-600 mb-2">Collaborative Deep Reading Platform</p>
                <p className="text-sm text-gray-500">
                  Highlight, comment, and collaborate on documents with branching discussions
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <Content 
            currentView={currentView}
            setCurrentView={setCurrentView}
            currentDocumentId={currentDocumentId}
            openDocument={openDocument}
          />
        </Authenticated>
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  currentView, 
  setCurrentView, 
  currentDocumentId, 
  openDocument 
}: {
  currentView: "list" | "create" | "document";
  setCurrentView: (view: "list" | "create" | "document") => void;
  currentDocumentId: Id<"documents"> | null;
  openDocument: (documentId: Id<"documents">) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (currentView === "create") {
    return <CreateDocument onBack={() => setCurrentView("list")} />;
  }

  if (currentView === "document" && currentDocumentId) {
    return <DocumentViewer documentId={currentDocumentId} />;
  }

  return <DocumentList onCreateNew={() => setCurrentView("create")} onOpenDocument={openDocument} />;
}
