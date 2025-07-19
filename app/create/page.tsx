"use client";

import { Authenticated } from "convex/react";
import { CreateDocument } from "../../src/components/CreateDocument";
import { SignOutButton } from "../../src/SignOutButton";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePage() {
  const router = useRouter();

  const goBack = () => {
    router.push("/");
  };

  return (
    <Authenticated>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-xl font-bold">NUU Sync</h1>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Library
              </button>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <CreateDocument onBack={goBack} />
      </main>
    </Authenticated>
  );
}