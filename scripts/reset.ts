/**
 * DEV ONLY — Destructive reset script.
 * Deletes ALL nodes and relationships from the database.
 * Run with: npm run db:reset
 */

import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (process.env.NODE_ENV === 'production') {
  console.error('✗ Reset is not allowed in production.');
  process.exit(1);
}

const driver = neo4j.driver(
  process.env.COGNODB_URI!,
  neo4j.auth.basic(process.env.COGNODB_USER!, process.env.COGNODB_PASSWORD!),
);

async function main() {
  console.log('⚠  Resetting database (DELETE ALL)…');
  const session = driver.session({ database: process.env.COGNODB_DATABASE ?? 'neo4j' });
  try {
    // Delete in batches to avoid transaction size limits
    let deleted = 1;
    while (deleted > 0) {
      const result = await session.run(
        `MATCH (n) WITH n LIMIT 10000 DETACH DELETE n RETURN count(n) AS deleted`,
      );
      deleted = result.records[0]?.get('deleted')?.toNumber?.() ?? 0;
      if (deleted > 0) console.log(`  Deleted ${deleted} nodes…`);
    }
    console.log('✓ Database reset complete. Run npm run db:seed to re-populate.');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
