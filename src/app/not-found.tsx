import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '64px', opacity: 0.2 }}>404</div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
        Service not found
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        This service ID doesn&apos;t exist in the graph database.
      </p>
      <Link
        href="/services"
        style={{
          padding: '8px 20px',
          borderRadius: '8px',
          background: 'var(--accent)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '13px',
          marginTop: '8px',
        }}
      >
        View all services
      </Link>
    </div>
  );
}
