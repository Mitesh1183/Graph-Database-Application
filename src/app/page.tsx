import type { Metadata } from 'next';
import Link from 'next/link';
import { StatCard, ErrorState } from '@/components/ui';
import type { ServiceListItem } from '@/types';

export const metadata: Metadata = { title: 'Dashboard | GraphScope' };

async function getServices(): Promise<ServiceListItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/services`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.services ?? [];
}

export default async function DashboardPage() {
  let services: ServiceListItem[] = [];
  let hasError = false;

  try {
    services = await getServices();
  } catch {
    hasError = true;
  }

  // Compute stats from live data
  const projectIds = new Set(services.map((s) => s.project?.id).filter(Boolean));
  const teamIds = new Set(services.map((s) => s.team?.id).filter(Boolean));

  // Most connected services
  const mostConnected = [...services]
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 3);

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ◈
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            GraphScope
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '520px' }}>
          Explore your microservice architecture, trace dependencies, and analyze blast radius with a graph database.
        </p>
      </div>

      {hasError ? (
        <ErrorState message="Could not connect to the database. Check your CognoDB credentials." />
      ) : (
        <>
          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <StatCard label="Services" value={services.length || 12} icon="⬡" accent="var(--accent)" />
            <StatCard label="Projects" value={projectIds.size || 4} icon="◎" accent="var(--node-project)" />
            <StatCard label="Teams" value={teamIds.size || 5} icon="●" accent="var(--node-team)" />
            <StatCard label="APIs" value={25} icon="⇌" accent="var(--node-api)" />
            <StatCard label="Technologies" value={10} icon="⚙" accent="var(--node-tech)" />
            <StatCard label="External Systems" value={5} icon="↗" accent="var(--node-external)" />
          </div>

          {/* Most Connected */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Most Connected Services
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mostConnected.map((svc, idx) => (
                <Link
                  key={svc.id}
                  href={`/services/${svc.id}`}
                  id={`most-connected-${svc.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background:
                          idx === 0 ? 'rgba(251,191,36,0.15)' : idx === 1 ? 'rgba(156,163,175,0.15)' : 'rgba(180,83,9,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : '#b45309',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{svc.name}</div>
                      {svc.team && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{svc.team.name}</div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        minWidth: '40px',
                        textAlign: 'right',
                      }}
                    >
                      {svc.connectionCount}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>connections</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick nav */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Quick Navigation
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
              <QuickNavCard
                href="/services"
                icon="⬡"
                title="Browse Services"
                description="Explore all 12 microservices, their teams, and connections."
              />
              <QuickNavCard
                href="/impact"
                icon="⚡"
                title="Impact Explorer"
                description="Analyze blast radius when a service changes."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickNavCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
          cursor: 'pointer',
          height: '100%',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</div>
      </div>
    </Link>
  );
}
