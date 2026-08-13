/**
 * Integration tests — require live CognoDB connection.
 * These test the actual API route behavior against the seeded database.
 *
 * Run: npm run test:integration
 *
 * Pre-requisites:
 *   - .env.local configured
 *   - npm run db:seed completed (61 nodes / 95 relationships)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import the query layer directly — no HTTP, no server
import { queryServicesList, queryServiceDetail } from '@/lib/cypher/services';
import { queryImpact } from '@/lib/cypher/impact';
import { queryShortestPath } from '@/lib/cypher/paths';
import { validateDepth } from '@/lib/validation';
import { getDriver } from '@/lib/cognodb/driver';

// Close driver after all tests
import { afterAll } from 'vitest';
afterAll(async () => {
  try { await getDriver().close(); } catch { /* ignore */ }
});

// ── Services List ─────────────────────────────────────────────────────────────
describe('GET /api/services (queryServicesList)', () => {
  it('returns exactly 12 services', async () => {
    const services = await queryServicesList();
    expect(services).toHaveLength(12);
  });

  it('all services have required fields', async () => {
    const services = await queryServicesList();
    for (const s of services) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(['frontend', 'gateway', 'backend']).toContain(s.type);
      expect(['active', 'maintenance', 'deprecated']).toContain(s.status);
      expect(['critical', 'high', 'medium', 'low']).toContain(s.criticality);
      expect(typeof s.connectionCount).toBe('number');
    }
  });

  it('services are ordered by name alphabetically', async () => {
    const services = await queryServicesList();
    const names = services.map((s) => s.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });
});

// ── Service Detail: Payment Service ──────────────────────────────────────────
describe('GET /api/services/payment-service', () => {
  let detail: Awaited<ReturnType<typeof queryServiceDetail>>;

  beforeAll(async () => {
    detail = await queryServiceDetail('payment-service');
  });

  it('returns a non-null result', () => {
    expect(detail).not.toBeNull();
  });

  it('has correct metadata', () => {
    expect(detail!.service.id).toBe('payment-service');
    expect(detail!.service.name).toBe('Payment Service');
    expect(detail!.service.criticality).toBe('critical');
    expect(detail!.service.type).toBe('backend');
    expect(detail!.service.version).toBe('2.4.0');
  });

  it('is owned by Payments Team', () => {
    expect(detail!.team?.id).toBe('payments-team');
    expect(detail!.team?.name).toBe('Payments Team');
  });

  it('is in Commerce Platform project', () => {
    expect(detail!.project?.id).toBe('commerce-platform');
  });

  it('has NO dependencies (calls no other service)', () => {
    expect(detail!.dependencies).toHaveLength(0);
  });

  it('has exactly 1 dependent: Order Service', () => {
    expect(detail!.dependents).toHaveLength(1);
    expect(detail!.dependents[0].id).toBe('order-service');
    expect(detail!.dependents[0].name).toBe('Order Service');
  });

  it('has 2 external integrations: Razorpay and Stripe', () => {
    expect(detail!.externalIntegrations).toHaveLength(2);
    const ids = detail!.externalIntegrations.map((e) => e.id).sort();
    expect(ids).toEqual(['razorpay', 'stripe']);
  });

  it('exposes 3 APIs', () => {
    expect(detail!.apis).toHaveLength(3);
    const paths = detail!.apis.map((a) => a.path).sort();
    expect(paths).toContain('/payments');
    expect(paths).toContain('/payments/:id');
    expect(paths).toContain('/payments/:id/refund');
  });

  it('uses 3 technologies', () => {
    const techIds = detail!.technologies.map((t) => t.id).sort();
    expect(techIds).toContain('nodejs');
    expect(techIds).toContain('postgresql');
    expect(techIds).toContain('redis');
  });
});

// ── Service Detail: Order Service ─────────────────────────────────────────────
describe('GET /api/services/order-service', () => {
  let detail: Awaited<ReturnType<typeof queryServiceDetail>>;

  beforeAll(async () => {
    detail = await queryServiceDetail('order-service');
  });

  it('has 3 dependencies', () => {
    expect(detail!.dependencies).toHaveLength(3);
    const ids = detail!.dependencies.map((d) => d.id).sort();
    expect(ids).toEqual(['inventory-service', 'notification-service', 'payment-service'].sort());
  });

  it('has 2 dependents: Checkout Service and Analytics Service', () => {
    expect(detail!.dependents).toHaveLength(2);
    const ids = detail!.dependents.map((d) => d.id).sort();
    expect(ids).toEqual(['analytics-service', 'checkout-service'].sort());
  });
});

// ── Service Detail: nonexistent ───────────────────────────────────────────────
describe('GET /api/services/nonexistent', () => {
  it('returns null for a nonexistent service ID', async () => {
    const result = await queryServiceDetail('nonexistent-service-xyz');
    expect(result).toBeNull();
  });
});

// ── Impact Analysis: Payment Service ─────────────────────────────────────────
describe('Impact analysis: payment-service', () => {
  it('depth 1: exactly 1 impacted service (Order Service)', async () => {
    const result = await queryImpact('payment-service', 1);
    expect(result).not.toBeNull();
    expect(result!.impactedServices).toHaveLength(1);
    expect(result!.impactedServices[0].id).toBe('order-service');
    expect(result!.impactedServices[0].hops).toBe(1);
    expect(result!.summary.totalImpacted).toBe(1);
  });

  it('depth 2: exactly 3 impacted services', async () => {
    const result = await queryImpact('payment-service', 2);
    expect(result).not.toBeNull();
    expect(result!.impactedServices).toHaveLength(3);
    const ids = result!.impactedServices.map((s) => s.id).sort();
    expect(ids).toEqual(['analytics-service', 'checkout-service', 'order-service'].sort());
    expect(result!.summary.totalImpacted).toBe(3);
  });

  it('depth 3: exactly 4 impacted services', async () => {
    const result = await queryImpact('payment-service', 3);
    expect(result).not.toBeNull();
    expect(result!.impactedServices).toHaveLength(4);
    const ids = result!.impactedServices.map((s) => s.id).sort();
    expect(ids).toEqual(['analytics-service', 'api-gateway', 'checkout-service', 'order-service'].sort());
    expect(result!.summary.totalImpacted).toBe(4);
  });

  it('depth 3: correct criticality breakdown (critical=3, high=0, medium=0, low=1)', async () => {
    const result = await queryImpact('payment-service', 3);
    expect(result!.summary.criticality.critical).toBe(3);
    expect(result!.summary.criticality.high).toBe(0);
    expect(result!.summary.criticality.medium).toBe(0);
    expect(result!.summary.criticality.low).toBe(1);
  });

  it('payment-service is NEVER included in its own impact results at any depth', async () => {
    for (const depth of [1, 2, 3] as const) {
      const result = await queryImpact('payment-service', depth);
      const ids = result!.impactedServices.map((s) => s.id);
      expect(ids).not.toContain('payment-service');
    }
  });

  it('depth 3: correct hop assignments', async () => {
    const result = await queryImpact('payment-service', 3);
    const byId = Object.fromEntries(result!.impactedServices.map((s) => [s.id, s.hops]));
    expect(byId['order-service']).toBe(1);
    expect(byId['checkout-service']).toBe(2);
    expect(byId['analytics-service']).toBe(2);
    expect(byId['api-gateway']).toBe(3);
  });

  it('external integrations are from target (payment-service), not impacted services', async () => {
    const result = await queryImpact('payment-service', 3);
    const extIds = result!.externalIntegrations.map((e) => e.id).sort();
    expect(extIds).toEqual(['razorpay', 'stripe']);
  });

  it('returns null for nonexistent service', async () => {
    const result = await queryImpact('nonexistent-service-xyz', 1);
    expect(result).toBeNull();
  });
});

// ── Shortest Path ─────────────────────────────────────────────────────────────
describe('Shortest path', () => {
  it('Checkout → Payment: found, path=[checkout, order, payment], hops=2', async () => {
    const result = await queryShortestPath('checkout-service', 'payment-service');
    expect(result.found).toBe(true);
    expect(result.hops).toBe(2);
    expect(result.path).toHaveLength(3);
    expect(result.path[0].id).toBe('checkout-service');
    expect(result.path[1].id).toBe('order-service');
    expect(result.path[2].id).toBe('payment-service');
  });

  it('Payment → Web App: not found (payment has no outgoing CALLS)', async () => {
    const result = await queryShortestPath('payment-service', 'web-app');
    expect(result.found).toBe(false);
    expect(result.path).toHaveLength(0);
    expect(result.hops).toBe(0);
  });

  it('Web App → Auth: found via Web App → API Gateway → User Service → Auth Service', async () => {
    const result = await queryShortestPath('web-app', 'auth-service');
    expect(result.found).toBe(true);
    expect(result.hops).toBe(3);
  });
});

// ── Validation: depth ─────────────────────────────────────────────────────────
describe('validateDepth', () => {
  it('depth=4 throws INVALID_DEPTH', () => {
    expect(() => validateDepth('4')).toThrow();
  });

  it('depth=0 throws INVALID_DEPTH', () => {
    expect(() => validateDepth('0')).toThrow();
  });

  it('depth=1,2,3 accepted', () => {
    expect(validateDepth('1')).toBe(1);
    expect(validateDepth('2')).toBe(2);
    expect(validateDepth('3')).toBe(3);
  });
});
