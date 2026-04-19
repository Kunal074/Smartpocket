import { NextResponse } from 'next/server';
import { verifyToken, extractToken } from './auth';

/**
 * Middleware helper for protected API routes.
 * Wraps an API route handler to require authentication.
 *
 * @param {Function} handler - The API route handler `(request, user, ...args) => Response`
 * @returns {Function} Wrapped handler `(request, ...args) => Response`
 */
export function withAuth(handler) {
  return async (request, ...args) => {
    const authHeader = request.headers.get('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    // Pass the decoded user payload to the actual handler
    return handler(request, user, ...args);
  };
}
