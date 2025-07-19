# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start both frontend (Vite) and backend (Convex) development servers in parallel
- `npm run dev:frontend` - Start only the frontend Vite development server (opens in browser)  
- `npm run dev:backend` - Start only the Convex backend development server
- `npm run build` - Build the frontend for production
- `npm run lint` - Run comprehensive linting including TypeScript checks for both frontend and backend, Convex validation, and production build

## Testing Authentication
When testing authentication, use the Password provider with any email/password combination for sign up. The auth system will create a new user account automatically.

**IMPORTANT**: Passwords must be at least 8 characters long for sign up to work.

Note: If authentication fails, ensure that:
1. JWT_PRIVATE_KEY is set in .env.local
2. The Convex backend is running (`npm run dev:backend`)
3. For new sign ups, click "Sign up instead" and enter email/password (min 8 chars)
4. Use "Anonymous" sign in for quick testing without password requirements

## Architecture Overview

This is **NUU Sync**, a collaborative deep reading platform built with React + Vite frontend and Convex backend. The app enables users to highlight text, add comments with branching discussions, and collaborate on documents.

### Frontend Structure (`src/`)
- **App.tsx** - Main application with authentication state and view routing (list/create/document views)
- **components/DocumentViewer.tsx** - Core document reading interface with comment sidebar
- **components/MarkdownRenderer.tsx** - Renders document content with simplified markdown parsing (highlighting temporarily disabled)
- **components/CommentSidebar.tsx** - Manages threaded comments and discussions
- **components/DocumentList.tsx** - Shows user's documents and shared documents
- **components/CreateDocument.tsx** - Document creation interface
- **SignInForm.tsx** - Authentication form with password validation

### Backend Structure (`convex/`)
- **schema.ts** - Database schema defining documents, highlights, comments, notes, and sharing permissions
- **documents.ts** - Document CRUD operations with access control and sharing
- **highlights.ts** - Text highlighting functionality
- **comments.ts** - Threaded commenting system with branching support
- **notes.ts** - Private/public note-taking on documents
- **auth.ts** - Authentication using Convex Auth with anonymous sign-in
- **router.ts** - HTTP API routes separate from auth routes (prevents LLM modification)

### Key Features
- **Document Management**: Create, share, and collaborate on markdown documents
- **Text Highlighting**: ⚠️ Temporarily disabled for stability (basic text selection works)
- **Branching Comments**: Threaded discussions that can branch from highlights or other comments
- **Access Control**: Public/private documents with granular sharing permissions (read/comment/edit)
- **Real-time Collaboration**: Live updates via Convex subscriptions
- **Clean UI**: Minimalist black and white design focused on reading

### Database Schema
- `documents` - Document content and metadata with creator/collaborator tracking
- `highlights` - Text selections with position offsets and styling
- `comments` - Threaded comments with optional highlight and parent references
- `notes` - Personal annotations linked to documents/highlights
- `documentShares` - Sharing permissions between users

## Technology Stack
- **Frontend**: React 19, Vite, TailwindCSS, TypeScript
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Convex Auth with Password provider (8+ chars) and Anonymous sign-in
- **Styling**: TailwindCSS with custom utilities, black and white theme
- **Notifications**: Sonner for toast messages
- **Markdown**: Custom regex-based parser (simplified for stability)

## Convex Deployment
Connected to Convex deployment: `abundant-jay-508`

## Known Issues
- Highlighting feature is temporarily disabled to prevent white screen crashes
- @mentions in comments may not work properly without user lookup
- Text selection UI exists but doesn't create persistent highlights

## Recent Fixes
- Fixed authentication by enforcing 8+ character password requirement
- Resolved white screen issue by simplifying markdown rendering
- Removed problematic HTML string manipulation in highlight system
- All TypeScript errors resolved and linting passes