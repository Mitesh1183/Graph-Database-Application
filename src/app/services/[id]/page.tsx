import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui';
import type { ServiceDetail } from '@/types';

export const metadata: Metadata = { title: 'Service Detail' };

async function getServiceDetail(id: string): Promise<ServiceDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/services/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch service: ${res.statusText}`);
  return res.json();
}

const CRITICALITY_BORDER: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: ServiceDetail | null = null;

  try {
    data = await getServiceDetail(id);
  } catch {
    // Show error fallback
    return (
      <div style={{ maxWidth: '900px' }}>
        <ServiceDetailError />
      </div>
    );
  }

  if (!data) notFound();

  const { service, project, team, technologies, apis, dependencies, dependents, externalIntegrations } = data;
  const accentColor = CRITICALITY_BORDER[service.criticality] ?? 'var(--accent)';

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <Link href="/services" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Services</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{service.name}</span>
      </nav>

      {/* Header */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid var(--border)`,
          borderTop: `3px solid ${accentColor}`,
          borderRadius: '12px',
          padding: '28px 32px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {service.name}
              </h1>
              <Badge value={service.criticality} variant="criticality" />
              <Badge value={service.type} variant="type" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              {service.description}
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
              {project && <span style={{ color: 'var(--text-secondary)' }}>⬡ {project.name}</span>}
              {team && <span style={{ color: 'var(--text-secondary)' }}>● {team.name}</span>}
            </div>
          </div>
          <Link
            href={`/impact?service=${service.id}`}
            id={`analyze-impact-${service.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ Analyze Impact
          </Link>
        </div>

        {/* Overview pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <InfoPill label="Status" value={service.status} />
          <InfoPill label="Version" value={`v${service.version}`} />
          <InfoPill label="Environment" value={service.environment} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Technologies */}
        <Section title="Technologies" count={technologies.length} icon="⚙">
          {technologies.length === 0 ? (
            <EmptyItem text="No technologies recorded" />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {technologies.map((tech) => (
                <div
                  key={tech.id}
                  title={`Purpose: ${tech.purpose}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    color: 'var(--node-tech)',
                    fontWeight: 500,
                    cursor: 'default',
                  }}
                >
                  {tech.name}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontSize: '11px' }}>
                    {tech.purpose}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* External Integrations */}
        <Section title="External Integrations" count={externalIntegrations.length} icon="↗">
          {externalIntegrations.length === 0 ? (
            <EmptyItem text="No external integrations" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {externalIntegrations.map((ext) => (
                <div key={ext.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--node-external)', fontSize: '13px' }}>{ext.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>({ext.type})</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ext.protocol}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* APIs */}
      <Section title="Exposed APIs" count={apis.length} icon="⇌" style={{ marginBottom: '20px' }}>
        {apis.length === 0 ? (
          <EmptyItem text="No APIs exposed (internal consumer only)" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {apis.map((api) => (
              <div
                key={api.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                }}
              >
                <Badge value={api.method} variant="method" />
                <code style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1 }}>{api.path}</code>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{api.description}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{api.version}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Dependencies */}
        <Section title="Dependencies" subtitle="services this calls" count={dependencies.length} icon="↓">
          {dependencies.length === 0 ? (
            <EmptyItem text="This service calls no other services" />
          ) : (
            <ServiceCallList items={dependencies} direction="out" />
          )}
        </Section>

        {/* Dependents */}
        <Section title="Dependents" subtitle="services that call this" count={dependents.length} icon="↑">
          {dependents.length === 0 ? (
            <EmptyItem text="No services call this service" />
          ) : (
            <ServiceCallList items={dependents} direction="in" />
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  count,
  icon,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  icon: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— {subtitle}</span>}
        {count !== undefined && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-hover)',
              padding: '1px 7px',
              borderRadius: '10px',
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        fontSize: '12px',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function EmptyItem({ text }: { text: string }) {
  return (
    <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{text}</p>
  );
}

function ServiceCallList({
  items,
  direction,
}: {
  items: Array<{ id: string; name: string; criticality: string; protocol: string; latencyMs: number }>;
  direction: 'in' | 'out';
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            textDecoration: 'none',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px' }}>{direction === 'in' ? '→' : '←'}</span>
            <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)' }}>{item.name}</span>
            <Badge value={item.criticality} variant="criticality" />
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'monospace' }}>{item.protocol}</span>
            <span>{item.latencyMs}ms</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ServiceDetailError() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <p>Failed to load service details. Please check your database connection.</p>
    </div>
  );
}
