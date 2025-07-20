"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import "../src/index.css";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>NUU Sync</title>
        <meta name="description" content="Deep reading, together" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-black">
        <ConvexAuthProvider client={convex}>
          {children}
          <Toaster />
        </ConvexAuthProvider>
      </body>
    </html>
  );
}