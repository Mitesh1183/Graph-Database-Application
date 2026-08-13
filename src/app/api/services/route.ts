import { verifyConnectivity } from '@/lib/cognodb/driver';
import { queryServicesList } from '@/lib/cypher/services';
import { handleRouteError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await verifyConnectivity();
    const services = await queryServicesList();
    return Response.json({ services });
  } catch (err) {
    return handleRouteError(err);
  }
}
