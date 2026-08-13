import type { NextRequest } from 'next/server';
import { verifyConnectivity } from '@/lib/cognodb/driver';
import { queryImpact } from '@/lib/cypher/impact';
import { handleRouteError, serviceNotFound } from '@/lib/errors';
import { validateDepth } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/impact/[id]'>) {
  try {
    await verifyConnectivity();
    const { id } = await ctx.params;
    const depthParam = new URL(req.url).searchParams.get('depth');
    const depth = validateDepth(depthParam);
    const result = await queryImpact(id, depth);
    if (!result) throw serviceNotFound();
    return Response.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
