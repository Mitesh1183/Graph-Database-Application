/**
 * Quick CognoDB connectivity check.
 * Run with: npm run db:check
 */

import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const driver = neo4j.driver(
  process.env.COGNODB_URI!,
  neo4j.auth.basic(process.env.COGNODB_USER!, process.env.COGNODB_PASSWORD!),
);

async function main() {
  console.log('🔌 CognoDB connectivity check…');
  console.log(`   URI: ${process.env.COGNODB_URI}`);
  console.log(`   User: ${process.env.COGNODB_USER}`);
  console.log(`   Database: ${process.env.COGNODB_DATABASE ?? 'neo4j'}`);

  try {
    await driver.verifyConnectivity();
    console.log('✓ Driver connectivity verified');

    const session = driver.session({ database: process.env.COGNODB_DATABASE ?? 'neo4j' });
    try {
      const result = await session.run('RETURN 1 AS ping');
      const ping = result.records[0]?.get('ping');
      console.log(`✓ Query test: RETURN 1 = ${ping}`);
    } finally {
      await session.close();
    }

    console.log('\n✅ CognoDB is reachable. Ready to seed.');
  } catch (err) {
    console.error('\n❌ CognoDB connection FAILED:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();
