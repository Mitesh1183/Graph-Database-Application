import neo4j, { type Driver } from 'neo4j-driver';
import { databaseUnavailable } from '@/lib/errors';

// ── Singleton pattern: one driver per Node.js instance ──────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver: Driver | undefined;
  // eslint-disable-next-line no-var
  var __neo4jConnectivityVerified: boolean | undefined;
}

function createDriver(): Driver {
  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error(
      'Missing CognoDB environment variables: COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD',
    );
  }

  return neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 10,
    connectionAcquisitionTimeout: 30_000,
  });
}

export function getDriver(): Driver {
  if (!globalThis.__neo4jDriver) {
    globalThis.__neo4jDriver = createDriver();
  }
  return globalThis.__neo4jDriver;
}

/**
 * Called once per Node.js instance initialization.
 * Verifies connectivity and throws 503 if DB is unreachable.
 */
export async function verifyConnectivity(): Promise<void> {
  if (globalThis.__neo4jConnectivityVerified) return;

  const driver = getDriver();
  try {
    await driver.verifyConnectivity();
    globalThis.__neo4jConnectivityVerified = true;
  } catch (err) {
    console.error('[GraphScope] CognoDB connectivity check failed:', err);
    throw databaseUnavailable();
  }
}

export const DATABASE = process.env.COGNODB_DATABASE ?? 'neo4j';
