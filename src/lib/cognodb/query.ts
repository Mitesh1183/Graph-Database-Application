import { type QueryResult, type RecordShape } from 'neo4j-driver';
import neo4j from 'neo4j-driver';
import { getDriver, DATABASE } from './driver';

/**
 * Run a parameterized Cypher query and return raw records.
 * One session per request, always closed in finally.
 */
export async function runQuery<T extends RecordShape = RecordShape>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<QueryResult<T>> {
  const driver = getDriver();
  const session = driver.session({ database: DATABASE });
  try {
    return await session.run<T>(cypher, params);
  } finally {
    await session.close();
  }
}

/**
 * Convert a Neo4j Integer to a JS number safely.
 */
export function toNumber(value: unknown): number {
  if (neo4j.isInt(value)) return (value as { toNumber(): number }).toNumber();
  if (typeof value === 'number') return value;
  return 0;
}

/**
 * Map a Neo4j node's properties to a plain object, converting Integer fields.
 */
export function mapNode<T extends Record<string, unknown>>(
  node: { properties: Record<string, unknown> } | null | undefined,
): T | null {
  if (!node) return null;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(node.properties)) {
    result[key] = neo4j.isInt(val) ? (val as { toNumber(): number }).toNumber() : val;
  }
  return result as T;
}
