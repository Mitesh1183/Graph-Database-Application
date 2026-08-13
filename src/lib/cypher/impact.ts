import { runQuery, mapNode, toNumber } from '@/lib/cognodb/query';
import type { ImpactResult, ServiceCriticality, ExternalSystemType } from '@/types';

// Depth-specific queries — WITH aggregation first, then OPTIONAL MATCH (1:1)
const IMPACT_QUERIES: Record<1 | 2 | 3, string> = {
  1: `MATCH path = (dep:Service)-[:CALLS]->(:Service {id: $serviceId})
      WITH dep, min(length(path)) AS hops
      OPTIONAL MATCH (dep)<-[:CONTAINS]-(p:Project)
      OPTIONAL MATCH (dep)-[:OWNED_BY]->(t:Team)
      RETURN dep, hops, p AS project, t AS team
      ORDER BY hops, dep.name`,

  2: `MATCH path = (dep:Service)-[:CALLS*1..2]->(:Service {id: $serviceId})
      WITH dep, min(length(path)) AS hops
      OPTIONAL MATCH (dep)<-[:CONTAINS]-(p:Project)
      OPTIONAL MATCH (dep)-[:OWNED_BY]->(t:Team)
      RETURN dep, hops, p AS project, t AS team
      ORDER BY hops, dep.name`,

  3: `MATCH path = (dep:Service)-[:CALLS*1..3]->(:Service {id: $serviceId})
      WITH dep, min(length(path)) AS hops
      OPTIONAL MATCH (dep)<-[:CONTAINS]-(p:Project)
      OPTIONAL MATCH (dep)-[:OWNED_BY]->(t:Team)
      RETURN dep, hops, p AS project, t AS team
      ORDER BY hops, dep.name`,
};

export async function queryImpact(
  serviceId: string,
  depth: 1 | 2 | 3,
): Promise<ImpactResult | null> {
  // Verify target service exists
  const targetResult = await runQuery(
    `MATCH (s:Service {id: $serviceId}) RETURN s`,
    { serviceId },
  );
  if (targetResult.records.length === 0) return null;

  const targetNode = mapNode<Record<string, unknown>>(
    targetResult.records[0].get('s') as { properties: Record<string, unknown> },
  )!;

  // Query A: Impacted services with context
  const impactResult = await runQuery(IMPACT_QUERIES[depth], { serviceId });

  const impactedServices: ImpactResult['impactedServices'] = [];
  const projectMap = new Map<string, { id: string; name: string }>();
  const teamMap = new Map<string, { id: string; name: string }>();

  for (const record of impactResult.records) {
    const dep = mapNode<Record<string, unknown>>(record.get('dep') as { properties: Record<string, unknown> });
    const hops = toNumber(record.get('hops'));
    const proj = mapNode<Record<string, unknown>>(record.get('project') as { properties: Record<string, unknown> } | null);
    const team = mapNode<Record<string, unknown>>(record.get('team') as { properties: Record<string, unknown> } | null);

    if (!dep) continue;

    impactedServices.push({
      id: dep.id as string,
      name: dep.name as string,
      criticality: dep.criticality as ServiceCriticality,
      hops,
    });

    if (proj) projectMap.set(proj.id as string, { id: proj.id as string, name: proj.name as string });
    if (team) teamMap.set(team.id as string, { id: team.id as string, name: team.name as string });
  }

  // Query B: Target's external integrations
  const externalResult = await runQuery(
    `MATCH (:Service {id: $serviceId})-[:INTEGRATES_WITH]->(e:ExternalSystem)
     RETURN e`,
    { serviceId },
  );
  const externalIntegrations = externalResult.records.map((r) => {
    const e = mapNode<Record<string, unknown>>(r.get('e') as { properties: Record<string, unknown> });
    return { id: e!.id as string, name: e!.name as string, type: e!.type as ExternalSystemType };
  });

  // Summary computed in API layer
  const critCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const svc of impactedServices) {
    critCounts[svc.criticality]++;
  }

  return {
    target: {
      id: targetNode.id as string,
      name: targetNode.name as string,
      criticality: targetNode.criticality as ServiceCriticality,
    },
    depth,
    impactedServices,
    affectedProjects: Array.from(projectMap.values()),
    involvedTeams: Array.from(teamMap.values()),
    externalIntegrations,
    summary: {
      totalImpacted: impactedServices.length,
      criticality: critCounts,
      projectCount: projectMap.size,
      teamCount: teamMap.size,
      externalCount: externalIntegrations.length,
    },
  };
}
