import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // For now, let client-side handle auth redirects
  // In the future, we could add server-side auth checks here
  return NextResponse.next()
}

// Only run middleware on protected routes
export const config = {
  matcher: [
    '/document/:path*',
    '/create'
  ]
}