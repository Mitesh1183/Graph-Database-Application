import type { NextRequest } from 'next/server';
import { verifyConnectivity } from '@/lib/cognodb/driver';
import { queryShortestPath } from '@/lib/cypher/paths';
import { handleRouteError } from '@/lib/errors';
import { validatePathParams } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await verifyConnectivity();
    const { searchParams } = new URL(req.url);
    const { from, to } = validatePathParams(
      searchParams.get('from'),
      searchParams.get('to'),
    );
    const result = await queryShortestPath(from, to);
    return Response.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
