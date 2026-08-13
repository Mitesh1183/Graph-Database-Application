/**
 * Idempotent seed script for GraphScope.
 * Uses MERGE on `id` property — safe to run multiple times.
 * Run with: npx ts-node --esm scripts/seed.ts
 *           OR: npm run db:seed
 *
 * Verifies exact counts after seeding:
 *   61 nodes, 95 relationships
 */

import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const driver = neo4j.driver(
  process.env.COGNODB_URI!,
  neo4j.auth.basic(process.env.COGNODB_USER!, process.env.COGNODB_PASSWORD!),
);

async function run(cypher: string, params: Record<string, unknown> = {}) {
  const session = driver.session({ database: process.env.COGNODB_DATABASE ?? 'neo4j' });
  try {
    await session.run(cypher, params);
  } finally {
    await session.close();
  }
}

async function count(cypher: string): Promise<number> {
  const session = driver.session({ database: process.env.COGNODB_DATABASE ?? 'neo4j' });
  try {
    const result = await session.run(cypher);
    const val = result.records[0]?.get(0);
    return neo4j.isInt(val) ? val.toNumber() : Number(val);
  } finally {
    await session.close();
  }
}

// ── Constraints ─────────────────────────────────────────────────────────────
async function createConstraints() {
  const labels = ['Project', 'Service', 'API', 'Technology', 'Team', 'ExternalSystem'];
  for (const label of labels) {
    try {
      await run(
        `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
      );
    } catch {
      // Ignore if already exists or constraint syntax differs
    }
  }
  console.log('✓ Constraints created');
}

// ── Nodes ─────────────────────────────────────────────────────────────────────
async function seedProjects() {
  const projects = [
    { id: 'commerce-platform', name: 'Commerce Platform', description: 'Core e-commerce platform powering online shopping', status: 'active' },
    { id: 'identity-platform', name: 'Identity Platform', description: 'User identity and authentication services', status: 'active' },
    { id: 'engagement-platform', name: 'Engagement Platform', description: 'Customer engagement and communication services', status: 'active' },
    { id: 'analytics-platform', name: 'Analytics Platform', description: 'Business intelligence and analytics', status: 'active' },
  ];
  for (const p of projects) {
    await run(
      `MERGE (n:Project {id: $id}) SET n += {name: $name, description: $description, status: $status}`,
      p,
    );
  }
  console.log(`✓ ${projects.length} Projects`);
}

async function seedTeams() {
  const teams = [
    { id: 'commerce-team', name: 'Commerce Team', lead: 'Sarah Chen', department: 'Engineering' },
    { id: 'platform-team', name: 'Platform Team', lead: 'Michael Park', department: 'Engineering' },
    { id: 'engagement-team', name: 'Engagement Team', lead: 'Lisa Wang', department: 'Engineering' },
    { id: 'data-team', name: 'Data Team', lead: 'James Rivera', department: 'Engineering' },
    { id: 'payments-team', name: 'Payments Team', lead: 'Priya Sharma', department: 'Engineering' },
  ];
  for (const t of teams) {
    await run(
      `MERGE (n:Team {id: $id}) SET n += {name: $name, lead: $lead, department: $department}`,
      t,
    );
  }
  console.log(`✓ ${teams.length} Teams`);
}

async function seedServices() {
  const services = [
    { id: 'web-app', name: 'Web App', description: 'Customer-facing web application', type: 'frontend', status: 'active', version: '3.2.0', environment: 'production', criticality: 'high' },
    { id: 'api-gateway', name: 'API Gateway', description: 'Central API gateway for routing and rate limiting', type: 'gateway', status: 'active', version: '2.8.1', environment: 'production', criticality: 'critical' },
    { id: 'auth-service', name: 'Auth Service', description: 'Authentication and authorization', type: 'backend', status: 'active', version: '1.5.0', environment: 'production', criticality: 'critical' },
    { id: 'user-service', name: 'User Service', description: 'User profile and account management', type: 'backend', status: 'active', version: '2.1.3', environment: 'production', criticality: 'high' },
    { id: 'product-service', name: 'Product Service', description: 'Product catalog and management', type: 'backend', status: 'active', version: '1.8.2', environment: 'production', criticality: 'medium' },
    { id: 'checkout-service', name: 'Checkout Service', description: 'Shopping cart and checkout processing', type: 'backend', status: 'active', version: '2.0.1', environment: 'production', criticality: 'critical' },
    { id: 'order-service', name: 'Order Service', description: 'Order processing and lifecycle management', type: 'backend', status: 'active', version: '3.1.0', environment: 'production', criticality: 'critical' },
    { id: 'payment-service', name: 'Payment Service', description: 'Payment processing and transaction management', type: 'backend', status: 'active', version: '2.4.0', environment: 'production', criticality: 'critical' },
    { id: 'inventory-service', name: 'Inventory Service', description: 'Inventory tracking and stock management', type: 'backend', status: 'active', version: '1.3.2', environment: 'production', criticality: 'high' },
    { id: 'notification-service', name: 'Notification Service', description: 'Email and push notification delivery', type: 'backend', status: 'active', version: '1.6.0', environment: 'production', criticality: 'medium' },
    { id: 'search-service', name: 'Search Service', description: 'Product search and indexing', type: 'backend', status: 'active', version: '1.2.0', environment: 'production', criticality: 'medium' },
    { id: 'analytics-service', name: 'Analytics Service', description: 'Business analytics and reporting', type: 'backend', status: 'active', version: '1.0.5', environment: 'production', criticality: 'low' },
  ];
  for (const s of services) {
    await run(
      `MERGE (n:Service {id: $id}) SET n += {name: $name, description: $description, type: $type, status: $status, version: $version, environment: $environment, criticality: $criticality}`,
      s,
    );
  }
  console.log(`✓ ${services.length} Services`);
}

async function seedTechnologies() {
  const techs = [
    { id: 'nodejs', name: 'Node.js', category: 'runtime' },
    { id: 'typescript', name: 'TypeScript', category: 'language' },
    { id: 'react', name: 'React', category: 'framework' },
    { id: 'nextjs', name: 'Next.js', category: 'framework' },
    { id: 'postgresql', name: 'PostgreSQL', category: 'database' },
    { id: 'redis', name: 'Redis', category: 'database' },
    { id: 'mongodb', name: 'MongoDB', category: 'database' },
    { id: 'elasticsearch', name: 'Elasticsearch', category: 'search' },
    { id: 'docker', name: 'Docker', category: 'infrastructure' },
    { id: 'aws', name: 'AWS', category: 'cloud' },
  ];
  for (const t of techs) {
    await run(`MERGE (n:Technology {id: $id}) SET n += {name: $name, category: $category}`, t);
  }
  console.log(`✓ ${techs.length} Technologies`);
}

async function seedExternalSystems() {
  const systems = [
    { id: 'razorpay', name: 'Razorpay', type: 'payment' },
    { id: 'stripe', name: 'Stripe', type: 'payment' },
    { id: 'warehouse-api', name: 'Warehouse API', type: 'logistics' },
    { id: 'sendgrid', name: 'SendGrid', type: 'email' },
    { id: 'salesforce', name: 'Salesforce', type: 'crm' },
  ];
  for (const s of systems) {
    await run(`MERGE (n:ExternalSystem {id: $id}) SET n += {name: $name, type: $type}`, s);
  }
  console.log(`✓ ${systems.length} ExternalSystems`);
}

async function seedAPIs() {
  const apis = [
    { id: 'gw-health', path: '/health', method: 'GET', description: 'Health check', exposedBy: 'api-gateway', version: 'v1' },
    { id: 'gw-status', path: '/api/status', method: 'GET', description: 'System status', exposedBy: 'api-gateway', version: 'v1' },
    { id: 'gw-routes', path: '/api/routes', method: 'GET', description: 'Available routes', exposedBy: 'api-gateway', version: 'v1' },
    { id: 'auth-login', path: '/auth/login', method: 'POST', description: 'User login', exposedBy: 'auth-service', version: 'v1' },
    { id: 'auth-register', path: '/auth/register', method: 'POST', description: 'User registration', exposedBy: 'auth-service', version: 'v1' },
    { id: 'auth-verify', path: '/auth/verify-token', method: 'POST', description: 'Token verification', exposedBy: 'auth-service', version: 'v1' },
    { id: 'users-get', path: '/users/:id', method: 'GET', description: 'Get user by ID', exposedBy: 'user-service', version: 'v2' },
    { id: 'users-update', path: '/users/:id', method: 'PUT', description: 'Update user', exposedBy: 'user-service', version: 'v1' },
    { id: 'users-profile', path: '/users/:id/profile', method: 'GET', description: 'Get user profile', exposedBy: 'user-service', version: 'v1' },
    { id: 'products-list', path: '/products', method: 'GET', description: 'List products', exposedBy: 'product-service', version: 'v2' },
    { id: 'products-get', path: '/products/:id', method: 'GET', description: 'Get product by ID', exposedBy: 'product-service', version: 'v1' },
    { id: 'products-search', path: '/products/search', method: 'POST', description: 'Search products', exposedBy: 'product-service', version: 'v1' },
    { id: 'checkout-create', path: '/checkout', method: 'POST', description: 'Create checkout', exposedBy: 'checkout-service', version: 'v1' },
    { id: 'checkout-validate', path: '/checkout/validate', method: 'POST', description: 'Validate checkout', exposedBy: 'checkout-service', version: 'v1' },
    { id: 'orders-create', path: '/orders', method: 'POST', description: 'Create order', exposedBy: 'order-service', version: 'v1' },
    { id: 'orders-get', path: '/orders/:id', method: 'GET', description: 'Get order by ID', exposedBy: 'order-service', version: 'v1' },
    { id: 'orders-by-user', path: '/orders/user/:userId', method: 'GET', description: 'Get orders by user', exposedBy: 'order-service', version: 'v1' },
    { id: 'payments-create', path: '/payments', method: 'POST', description: 'Process payment', exposedBy: 'payment-service', version: 'v2' },
    { id: 'payments-get', path: '/payments/:id', method: 'GET', description: 'Get payment by ID', exposedBy: 'payment-service', version: 'v1' },
    { id: 'payments-refund', path: '/payments/:id/refund', method: 'POST', description: 'Refund payment', exposedBy: 'payment-service', version: 'v1' },
    { id: 'inventory-check', path: '/inventory/:productId', method: 'GET', description: 'Check stock', exposedBy: 'inventory-service', version: 'v1' },
    { id: 'inventory-reserve', path: '/inventory/:productId/reserve', method: 'PUT', description: 'Reserve stock', exposedBy: 'inventory-service', version: 'v1' },
    { id: 'notify-send', path: '/notifications/send', method: 'POST', description: 'Send notification', exposedBy: 'notification-service', version: 'v1' },
    { id: 'notify-email', path: '/notifications/email', method: 'POST', description: 'Send email', exposedBy: 'notification-service', version: 'v1' },
    { id: 'search-query', path: '/search', method: 'GET', description: 'Search products', exposedBy: 'search-service', version: 'v1' },
  ];
  for (const a of apis) {
    await run(
      `MERGE (n:API {id: $id}) SET n += {path: $path, method: $method, description: $description}`,
      { id: a.id, path: a.path, method: a.method, description: a.description },
    );
    await run(
      `MATCH (s:Service {id: $svcId}), (a:API {id: $apiId})
       MERGE (s)-[:EXPOSES {version: $version}]->(a)`,
      { svcId: a.exposedBy, apiId: a.id, version: a.version },
    );
  }
  console.log(`✓ ${apis.length} APIs + EXPOSES relationships`);
}

// ── Relationships ─────────────────────────────────────────────────────────────
async function seedRelationships() {
  // CONTAINS
  const contains = [
    ['commerce-platform', 'api-gateway'], ['commerce-platform', 'product-service'],
    ['commerce-platform', 'checkout-service'], ['commerce-platform', 'order-service'],
    ['commerce-platform', 'payment-service'], ['commerce-platform', 'inventory-service'],
    ['identity-platform', 'auth-service'], ['identity-platform', 'user-service'],
    ['engagement-platform', 'notification-service'], ['engagement-platform', 'search-service'],
    ['analytics-platform', 'analytics-service'], ['analytics-platform', 'web-app'],
  ];
  for (const [proj, svc] of contains) {
    await run(
      `MATCH (p:Project {id: $proj}), (s:Service {id: $svc}) MERGE (p)-[:CONTAINS]->(s)`,
      { proj, svc },
    );
  }

  // OWNED_BY (Project → Team)
  const projTeams = [
    ['commerce-platform', 'commerce-team'], ['identity-platform', 'platform-team'],
    ['engagement-platform', 'engagement-team'], ['analytics-platform', 'data-team'],
  ];
  for (const [proj, team] of projTeams) {
    await run(
      `MATCH (p:Project {id: $proj}), (t:Team {id: $team}) MERGE (p)-[:OWNED_BY]->(t)`,
      { proj, team },
    );
  }

  // OWNED_BY (Service → Team)
  const svcTeams = [
    ['web-app', 'data-team'], ['api-gateway', 'commerce-team'],
    ['auth-service', 'platform-team'], ['user-service', 'platform-team'],
    ['product-service', 'commerce-team'], ['checkout-service', 'commerce-team'],
    ['order-service', 'commerce-team'], ['payment-service', 'payments-team'],
    ['inventory-service', 'commerce-team'], ['notification-service', 'engagement-team'],
    ['search-service', 'engagement-team'], ['analytics-service', 'data-team'],
  ];
  for (const [svc, team] of svcTeams) {
    await run(
      `MATCH (s:Service {id: $svc}), (t:Team {id: $team}) MERGE (s)-[:OWNED_BY]->(t)`,
      { svc, team },
    );
  }

  // CALLS (with protocol + latencyMs)
  const calls = [
    { from: 'web-app', to: 'api-gateway', protocol: 'HTTP', latencyMs: 10 },
    { from: 'api-gateway', to: 'checkout-service', protocol: 'HTTP', latencyMs: 15 },
    { from: 'api-gateway', to: 'user-service', protocol: 'HTTP', latencyMs: 20 },
    { from: 'api-gateway', to: 'product-service', protocol: 'HTTP', latencyMs: 18 },
    { from: 'checkout-service', to: 'order-service', protocol: 'HTTP', latencyMs: 25 },
    { from: 'order-service', to: 'payment-service', protocol: 'HTTP', latencyMs: 45 },
    { from: 'order-service', to: 'inventory-service', protocol: 'HTTP', latencyMs: 30 },
    { from: 'order-service', to: 'notification-service', protocol: 'HTTP', latencyMs: 15 },
    { from: 'user-service', to: 'auth-service', protocol: 'HTTP', latencyMs: 12 },
    { from: 'product-service', to: 'search-service', protocol: 'HTTP', latencyMs: 22 },
    { from: 'analytics-service', to: 'order-service', protocol: 'HTTP', latencyMs: 35 },
    { from: 'analytics-service', to: 'user-service', protocol: 'HTTP', latencyMs: 28 },
  ];
  for (const c of calls) {
    await run(
      `MATCH (a:Service {id: $from}), (b:Service {id: $to})
       MERGE (a)-[r:CALLS {protocol: $protocol}]->(b)
       SET r.latencyMs = $latencyMs`,
      c,
    );
  }

  // USES (Service → Technology)
  const uses = [
    { svc: 'web-app', tech: 'react', purpose: 'ui-framework' },
    { svc: 'web-app', tech: 'nextjs', purpose: 'framework' },
    { svc: 'web-app', tech: 'typescript', purpose: 'language' },
    { svc: 'api-gateway', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'api-gateway', tech: 'docker', purpose: 'containerization' },
    { svc: 'auth-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'auth-service', tech: 'postgresql', purpose: 'primary-database' },
    { svc: 'user-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'user-service', tech: 'postgresql', purpose: 'primary-database' },
    { svc: 'product-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'product-service', tech: 'postgresql', purpose: 'primary-database' },
    { svc: 'checkout-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'checkout-service', tech: 'redis', purpose: 'session-management' },
    { svc: 'order-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'order-service', tech: 'postgresql', purpose: 'primary-database' },
    { svc: 'payment-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'payment-service', tech: 'postgresql', purpose: 'primary-database' },
    { svc: 'payment-service', tech: 'redis', purpose: 'caching' },
    { svc: 'inventory-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'inventory-service', tech: 'mongodb', purpose: 'primary-database' },
    { svc: 'notification-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'notification-service', tech: 'redis', purpose: 'message-queue' },
    { svc: 'search-service', tech: 'nodejs', purpose: 'runtime' },
    { svc: 'search-service', tech: 'elasticsearch', purpose: 'search-engine' },
    { svc: 'analytics-service', tech: 'aws', purpose: 'data-pipeline' },
  ];
  for (const u of uses) {
    await run(
      `MATCH (s:Service {id: $svc}), (t:Technology {id: $tech})
       MERGE (s)-[r:USES {purpose: $purpose}]->(t)`,
      u,
    );
  }

  // INTEGRATES_WITH (Service → ExternalSystem)
  const integrations = [
    { svc: 'payment-service', ext: 'razorpay', protocol: 'HTTPS' },
    { svc: 'payment-service', ext: 'stripe', protocol: 'HTTPS' },
    { svc: 'inventory-service', ext: 'warehouse-api', protocol: 'HTTP' },
    { svc: 'notification-service', ext: 'sendgrid', protocol: 'HTTPS' },
    { svc: 'analytics-service', ext: 'salesforce', protocol: 'HTTPS' },
  ];
  for (const i of integrations) {
    await run(
      `MATCH (s:Service {id: $svc}), (e:ExternalSystem {id: $ext})
       MERGE (s)-[r:INTEGRATES_WITH {protocol: $protocol}]->(e)`,
      i,
    );
  }

  console.log('✓ All relationships seeded');
}

// ── Verification ──────────────────────────────────────────────────────────────
async function verify() {
  const nodeCount = await count('MATCH (n) RETURN count(n)');
  const relCount = await count('MATCH ()-[r]->() RETURN count(r)');

  const details = {
    CONTAINS: await count('MATCH ()-[r:CONTAINS]->() RETURN count(r)'),
    OWNED_BY: await count('MATCH ()-[r:OWNED_BY]->() RETURN count(r)'),
    CALLS: await count('MATCH ()-[r:CALLS]->() RETURN count(r)'),
    EXPOSES: await count('MATCH ()-[r:EXPOSES]->() RETURN count(r)'),
    USES: await count('MATCH ()-[r:USES]->() RETURN count(r)'),
    INTEGRATES_WITH: await count('MATCH ()-[r:INTEGRATES_WITH]->() RETURN count(r)'),
  };

  console.log('\n── Verification ──');
  console.log(`Nodes:         ${nodeCount} (expected: 61)`);
  console.log(`Relationships: ${relCount} (expected: 95)`);
  console.log('Breakdown:', details);

  const pass = nodeCount === 61 && relCount === 95;
  if (pass) {
    console.log('\n✓ PASS — Exact counts match!');
  } else {
    console.warn('\n✗ FAIL — Counts do not match. Check seed data.');
    process.exit(1);
  }
}

async function main() {
  console.log('🌱 GraphScope Seed Script\n');
  try {
    await createConstraints();
    await seedProjects();
    await seedTeams();
    await seedServices();
    await seedTechnologies();
    await seedExternalSystems();
    await seedAPIs();
    await seedRelationships();
    await verify();
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
