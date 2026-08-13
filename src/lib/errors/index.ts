import type { ErrorCode } from '@/types';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse() {
    return Response.json(
      { code: this.code, message: this.message },
      { status: this.statusCode },
    );
  }
}

export function invalidDepth() {
  return new AppError('INVALID_DEPTH', 'Depth must be 1, 2, or 3.', 400);
}

export function invalidParams(msg = "Both 'from' and 'to' are required.") {
  return new AppError('INVALID_PARAMS', msg, 400);
}

export function serviceNotFound() {
  return new AppError('SERVICE_NOT_FOUND', 'Service not found.', 404);
}

export function databaseUnavailable() {
  return new AppError('DATABASE_UNAVAILABLE', 'Database is currently unavailable.', 503);
}

export function internalError(msg = 'An unexpected error occurred.') {
  return new AppError('INTERNAL_ERROR', msg, 500);
}

/** Maps any thrown value to a Response, never leaking raw DB errors to the client. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof AppError) {
    return err.toResponse();
  }

  // Log raw error server-side only
  console.error('[GraphScope] Unhandled error:', err);

  // Check for Neo4j connectivity errors
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('connection') ||
      msg.includes('unreachable') ||
      msg.includes('econnrefused') ||
      msg.includes('timeout')
    ) {
      return databaseUnavailable().toResponse();
    }
  }

  return internalError().toResponse();
}
