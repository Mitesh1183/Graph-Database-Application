import { invalidDepth, invalidParams } from '@/lib/errors';

const VALID_DEPTHS = new Set([1, 2, 3]);

/**
 * Validates `depth` query param. Returns the numeric depth or throws AppError.
 */
export function validateDepth(raw: string | null): 1 | 2 | 3 {
  if (raw === null) return 1; // default
  const n = parseInt(raw, 10);
  if (!VALID_DEPTHS.has(n)) throw invalidDepth();
  return n as 1 | 2 | 3;
}

/**
 * Validates a service ID — must be a non-empty string after trim.
 */
export function validateServiceId(raw: string | undefined | null): string {
  const id = raw?.trim();
  if (!id) throw invalidParams('Service ID is required.');
  return id;
}

/**
 * Validates `from` and `to` query params for the path endpoint.
 */
export function validatePathParams(
  from: string | null,
  to: string | null,
): { from: string; to: string } {
  if (!from?.trim() || !to?.trim()) {
    throw invalidParams("Both 'from' and 'to' are required.");
  }
  return { from: from.trim(), to: to.trim() };
}
