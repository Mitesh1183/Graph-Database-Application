// Skeleton loading placeholder
export function Skeleton({ width = '100%', height = '16px', style = {} }: {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '6px',
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

// Error state display
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '40px', opacity: 0.5 }}>⚠</div>
      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
          Something went wrong
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '380px' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// Empty state display
export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '36px', opacity: 0.3 }}>○</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '320px' }}>
        {message}
      </p>
    </div>
  );
}

// Badge component
type BadgeVariant = 'criticality' | 'status' | 'type' | 'tech' | 'method';

const CRITICALITY_COLORS: Record<string, string> = {
  critical: '#ef444422',
  high: '#f9731622',
  medium: '#eab30822',
  low: '#22c55e22',
};
const CRITICALITY_TEXT: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#4ade80',
};
const STATUS_COLORS: Record<string, string> = {
  active: '#10b98120',
  maintenance: '#f59e0b20',
  deprecated: '#6b728020',
};
const STATUS_TEXT: Record<string, string> = {
  active: '#34d399',
  maintenance: '#fbbf24',
  deprecated: '#9ca3af',
};
const TYPE_COLORS: Record<string, string> = {
  frontend: '#06b6d420',
  gateway: '#8b5cf620',
  backend: '#3b82f620',
};
const TYPE_TEXT: Record<string, string> = {
  frontend: '#22d3ee',
  gateway: '#a78bfa',
  backend: '#60a5fa',
};
const METHOD_COLORS: Record<string, string> = {
  GET: '#10b98120',
  POST: '#3b82f620',
  PUT: '#f59e0b20',
  PATCH: '#8b5cf620',
  DELETE: '#ef444420',
};
const METHOD_TEXT: Record<string, string> = {
  GET: '#34d399',
  POST: '#60a5fa',
  PUT: '#fbbf24',
  PATCH: '#a78bfa',
  DELETE: '#f87171',
};

export function Badge({
  value,
  variant,
}: {
  value: string;
  variant: BadgeVariant;
}) {
  let bg = 'var(--bg-elevated)';
  let color = 'var(--text-secondary)';

  if (variant === 'criticality') {
    bg = CRITICALITY_COLORS[value] ?? bg;
    color = CRITICALITY_TEXT[value] ?? color;
  } else if (variant === 'status') {
    bg = STATUS_COLORS[value] ?? bg;
    color = STATUS_TEXT[value] ?? color;
  } else if (variant === 'type') {
    bg = TYPE_COLORS[value] ?? bg;
    color = TYPE_TEXT[value] ?? color;
  } else if (variant === 'method') {
    bg = METHOD_COLORS[value] ?? bg;
    color = METHOD_TEXT[value] ?? color;
  } else if (variant === 'tech') {
    bg = '#10b98115';
    color = '#34d399';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: 600,
        background: bg,
        color,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  );
}

// Stat card
export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
