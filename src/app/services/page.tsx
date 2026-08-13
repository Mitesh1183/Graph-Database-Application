import type { Metadata } from 'next';
import { ErrorState } from '@/components/ui';
import ServiceCard from '@/components/services/ServiceCard';
import type { ServiceListItem } from '@/types';

export const metadata: Metadata = { title: 'Services' };

async function getServices(): Promise<ServiceListItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/services`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch services');
  const data = await res.json();
  return data.services;
}

export default async function ServicesPage() {
  let services: ServiceListItem[] = [];
  let error: string | null = null;

  try {
    services = await getServices();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Services
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {services.length > 0
            ? `${services.length} microservices across your architecture`
            : 'All microservices in your graph'}
        </p>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          No services found. Run the seed script to populate the database.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {services.map((svc) => (
            <ServiceCard key={svc.id} service={svc} />
          ))}
        </div>
      )}
    </div>
  );
}
