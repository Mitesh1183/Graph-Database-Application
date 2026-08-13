import type { NextRequest } from 'next/server';
import { verifyConnectivity } from '@/lib/cognodb/driver';
import { queryServiceDetail } from '@/lib/cypher/services';
import { handleRouteError, serviceNotFound } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/services/[id]'>) {
  try {
    await verifyConnectivity();
    const { id } = await ctx.params;
    const detail = await queryServiceDetail(id);
    if (!detail) throw serviceNotFound();
    return Response.json(detail);
  } catch (err) {
    return handleRouteError(err);
  }
}
