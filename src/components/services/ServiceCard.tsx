'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui';
import type { ServiceListItem } from '@/types';

export default function ServiceCard({ service }: { service: ServiceListItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/services/${service.id}`}
      id={`service-card-${service.id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
          height: '100%',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {service.name}
          </h2>
          <Badge value={service.criticality} variant="criticality" />
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Badge value={service.type} variant="type" />
          <Badge value={service.status} variant="status" />
        </div>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {service.project && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '50px' }}>Project</span>
              <span style={{ color: 'var(--text-secondary)' }}>{service.project.name}</span>
            </div>
          )}
          {service.team && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '50px' }}>Team</span>
              <span style={{ color: 'var(--text-secondary)' }}>{service.team.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', minWidth: '50px' }}>Links</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {service.connectionCount} connection{service.connectionCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
