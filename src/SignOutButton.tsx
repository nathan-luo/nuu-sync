"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {user && (
        <div className="flex items-center gap-2">
          <div className="avatar avatar-sm">
            {user.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user.email || "Anonymous"}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => void signOut()}
        className="btn-ghost text-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
