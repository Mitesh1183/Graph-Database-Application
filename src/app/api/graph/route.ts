import { verifyConnectivity } from '@/lib/cognodb/driver';
import { queryGraph } from '@/lib/cypher/paths';
import { handleRouteError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await verifyConnectivity();
    const graph = await queryGraph();
    return Response.json(graph);
  } catch (err) {
    return handleRouteError(err);
  }
}
