"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "../src/SignInForm";
import { SignOutButton } from "../src/SignOutButton";
import { DocumentList } from "../src/components/DocumentList";
import { useRouter } from "next/navigation";
import { Id } from "../convex/_generated/dataModel";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const openDocument = (documentId: Id<"documents">) => {
    router.push(`/document/${documentId}`);
  };

  const goToCreate = () => {
    router.push("/create");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-xl font-bold">NUU Sync</h1>
            </Link>
            <Authenticated>
              <div className="flex items-center gap-4">
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
          <Content openDocument={openDocument} goToCreate={goToCreate} />
        </Authenticated>
      </main>
    </>
  );
}

function Content({ 
  openDocument,
  goToCreate
}: {
  openDocument: (documentId: Id<"documents">) => void;
  goToCreate: () => void;
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

  return <DocumentList onCreateNew={goToCreate} onOpenDocument={openDocument} />;
}