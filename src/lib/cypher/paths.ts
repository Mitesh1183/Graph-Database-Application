import { runQuery, mapNode, toNumber } from '@/lib/cognodb/query';
import type { PathResult, GraphData, ServiceCriticality } from '@/types';

// ── Shortest Path (directed) ─────────────────────────────────────────────────

export async function queryShortestPath(fromId: string, toId: string): Promise<PathResult> {
  const result = await runQuery(
    `MATCH path = shortestPath(
       (a:Service {id: $fromId})-[:CALLS*]->(b:Service {id: $toId})
     )
     RETURN [n IN nodes(path) | n] AS pathNodes, length(path) AS hops`,
    { fromId, toId },
  );

  if (result.records.length === 0) {
    return { found: false, path: [], hops: 0 };
  }

  const record = result.records[0];
  const pathNodes = record.get('pathNodes') as Array<{ properties: Record<string, unknown> }>;
  const hops = toNumber(record.get('hops'));

  const path = pathNodes.map((node) => {
    const n = mapNode<{ id: string; name: string }>(node)!;
    return { id: n.id, name: n.name };
  });

  return { found: true, path, hops };
}

// ── Graph Data for Visualization ─────────────────────────────────────────────

export async function queryGraph(): Promise<GraphData> {
  // Returns all Service nodes and their CALLS edges for visualization
  const nodesResult = await runQuery(
    `MATCH (s:Service) RETURN s`,
  );
  const edgesResult = await runQuery(
    `MATCH (a:Service)-[r:CALLS]->(b:Service) RETURN a.id AS source, b.id AS target, r.protocol AS protocol, r.latencyMs AS latencyMs`,
  );

  const nodes: GraphData['nodes'] = nodesResult.records.map((record) => {
    const s = mapNode<Record<string, unknown>>(record.get('s') as { properties: Record<string, unknown> });
    return {
      id: s!.id as string,
      name: s!.name as string,
      type: 'service' as const,
      criticality: s!.criticality as ServiceCriticality,
    };
  });

  const edges: GraphData['edges'] = edgesResult.records.map((record) => ({
    source: record.get('source') as string,
    target: record.get('target') as string,
    type: 'CALLS' as const,
    protocol: record.get('protocol') as string,
    latencyMs: toNumber(record.get('latencyMs')),
  }));

  return { nodes, edges };
}
