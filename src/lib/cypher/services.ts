import { runQuery, mapNode, toNumber } from '@/lib/cognodb/query';
import type { ServiceListItem, ServiceDetail } from '@/types';

// ── Services List ─────────────────────────────────────────────────────────────

export async function queryServicesList(): Promise<ServiceListItem[]> {
  const result = await runQuery(`
    MATCH (s:Service)
    OPTIONAL MATCH (s)-[:OWNED_BY]->(t:Team)
    OPTIONAL MATCH (s)<-[:CONTAINS]-(p:Project)
    OPTIONAL MATCH (s)-[out:CALLS]->()
    OPTIONAL MATCH ()-[inc:CALLS]->(s)
    RETURN s, t, p,
           count(DISTINCT out) + count(DISTINCT inc) AS connectionCount
    ORDER BY s.name
  `);

  return result.records.map((record) => {
    const s = mapNode<Record<string, unknown>>(record.get('s') as { properties: Record<string, unknown> });
    const t = mapNode<Record<string, unknown>>(record.get('t') as { properties: Record<string, unknown> } | null);
    const p = mapNode<Record<string, unknown>>(record.get('p') as { properties: Record<string, unknown> } | null);
    const connectionCount = toNumber(record.get('connectionCount'));

    return {
      id: s!.id as string,
      name: s!.name as string,
      type: s!.type as ServiceListItem['type'],
      status: s!.status as ServiceListItem['status'],
      criticality: s!.criticality as ServiceListItem['criticality'],
      project: p ? { id: p.id as string, name: p.name as string } : null,
      team: t ? { id: t.id as string, name: t.name as string } : null,
      connectionCount,
    } satisfies ServiceListItem;
  });
}

// ── Service Detail (6 focused queries — no Cartesian product) ─────────────────

export async function queryServiceDetail(serviceId: string): Promise<ServiceDetail | null> {
  // Q1: Core + team + project
  const q1 = await runQuery(
    `MATCH (s:Service {id: $serviceId})
     OPTIONAL MATCH (s)-[:OWNED_BY]->(t:Team)
     OPTIONAL MATCH (s)<-[:CONTAINS]-(p:Project)
     RETURN s, t, p`,
    { serviceId },
  );

  if (q1.records.length === 0) return null;

  const rec1 = q1.records[0];
  const service = mapNode<Record<string, unknown>>(rec1.get('s') as { properties: Record<string, unknown> });
  const team = mapNode<Record<string, unknown>>(rec1.get('t') as { properties: Record<string, unknown> } | null);
  const project = mapNode<Record<string, unknown>>(rec1.get('p') as { properties: Record<string, unknown> } | null);

  // Q2: Technologies
  const q2 = await runQuery(
    `MATCH (:Service {id: $serviceId})-[r:USES]->(t:Technology)
     RETURN t, r.purpose AS purpose`,
    { serviceId },
  );
  const technologies = q2.records.map((r) => {
    const t = mapNode<Record<string, unknown>>(r.get('t') as { properties: Record<string, unknown> });
    return { ...(t as object), purpose: r.get('purpose') as string } as ServiceDetail['technologies'][number];
  });

  // Q3: APIs
  const q3 = await runQuery(
    `MATCH (:Service {id: $serviceId})-[r:EXPOSES]->(a:API)
     RETURN a, r.version AS version`,
    { serviceId },
  );
  const apis = q3.records.map((r) => {
    const a = mapNode<Record<string, unknown>>(r.get('a') as { properties: Record<string, unknown> });
    return { ...(a as object), version: r.get('version') as string } as ServiceDetail['apis'][number];
  });

  // Q4: Dependencies (outgoing CALLS)
  const q4 = await runQuery(
    `MATCH (:Service {id: $serviceId})-[r:CALLS]->(d:Service)
     RETURN d, r.protocol AS protocol, r.latencyMs AS latencyMs`,
    { serviceId },
  );
  const dependencies = q4.records.map((r) => {
    const d = mapNode<Record<string, unknown>>(r.get('d') as { properties: Record<string, unknown> });
    return {
      id: d!.id as string,
      name: d!.name as string,
      criticality: d!.criticality,
      protocol: r.get('protocol') as string,
      latencyMs: toNumber(r.get('latencyMs')),
    } as ServiceDetail['dependencies'][number];
  });

  // Q5: Dependents (incoming CALLS)
  const q5 = await runQuery(
    `MATCH (d:Service)-[r:CALLS]->(:Service {id: $serviceId})
     RETURN d, r.protocol AS protocol, r.latencyMs AS latencyMs`,
    { serviceId },
  );
  const dependents = q5.records.map((r) => {
    const d = mapNode<Record<string, unknown>>(r.get('d') as { properties: Record<string, unknown> });
    return {
      id: d!.id as string,
      name: d!.name as string,
      criticality: d!.criticality,
      protocol: r.get('protocol') as string,
      latencyMs: toNumber(r.get('latencyMs')),
    } as ServiceDetail['dependents'][number];
  });

  // Q6: External integrations
  const q6 = await runQuery(
    `MATCH (:Service {id: $serviceId})-[r:INTEGRATES_WITH]->(e:ExternalSystem)
     RETURN e, r.protocol AS protocol`,
    { serviceId },
  );
  const externalIntegrations = q6.records.map((r) => {
    const e = mapNode<Record<string, unknown>>(r.get('e') as { properties: Record<string, unknown> });
    return {
      id: e!.id as string,
      name: e!.name as string,
      type: e!.type,
      protocol: r.get('protocol') as string,
    } as ServiceDetail['externalIntegrations'][number];
  });

  return {
    service: service as unknown as ServiceDetail['service'],
    project: project as unknown as ServiceDetail['project'],
    team: team as unknown as ServiceDetail['team'],
    technologies,
    apis,
    dependencies,
    dependents,
    externalIntegrations,
  };
}
