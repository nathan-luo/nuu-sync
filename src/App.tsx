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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex justify-between items-center">
            <h1 className="text-xl font-bold">NUU Sync</h1>
        <Authenticated>
          <div className="flex items-center gap-4">
            {currentView !== "list" && (
              <button
                onClick={goBack}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Library
              </button>
            )}
            <SignOutButton />
          </div>
        </Authenticated>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-12">
                <h1 className="text-5xl font-bold text-center mb-3">NUU Sync</h1>
                <p className="text-center text-gray-600">Deep reading, together</p>
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
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
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
