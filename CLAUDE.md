# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start both frontend (Vite) and backend (Convex) development servers in parallel
- `npm run dev:frontend` - Start only the frontend Vite development server (opens in browser)
- `npm run dev:backend` - Start only the Convex backend development server
- `npm run build` - Build the frontend for production
- `npm run lint` - Run comprehensive linting including TypeScript checks for both frontend and backend, Convex validation, and production build

## Architecture Overview

This is **NUU Sync**, a collaborative deep reading platform built with React + Vite frontend and Convex backend. The app enables users to highlight text, add comments with branching discussions, and collaborate on documents.

### Frontend Structure (`src/`)
- **App.tsx** - Main application with authentication state and view routing (list/create/document views)
- **components/DocumentViewer.tsx** - Core document reading interface with highlighting and comment sidebar
- **components/MarkdownRenderer.tsx** - Renders document content with highlight overlays
- **components/CommentSidebar.tsx** - Manages threaded comments and discussions
- **components/DocumentList.tsx** - Shows user's documents and shared documents
- **components/CreateDocument.tsx** - Document creation interface

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
- **Text Highlighting**: Select text ranges with color-coded highlights
- **Branching Comments**: Threaded discussions that can branch from highlights or other comments
- **Access Control**: Public/private documents with granular sharing permissions (read/comment/edit)
- **Real-time Collaboration**: Live updates via Convex subscriptions

### Database Schema
- `documents` - Document content and metadata with creator/collaborator tracking
- `highlights` - Text selections with position offsets and styling
- `comments` - Threaded comments with optional highlight and parent references
- `notes` - Personal annotations linked to documents/highlights
- `documentShares` - Sharing permissions between users

## Technology Stack
- **Frontend**: React 19, Vite, TailwindCSS, TypeScript
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Convex Auth with anonymous sign-in
- **Styling**: TailwindCSS with custom utilities
- **Notifications**: Sonner for toast messages

## Convex Deployment
Connected to Convex deployment: `abundant-jay-508`