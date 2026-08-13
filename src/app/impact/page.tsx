'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge, ErrorState, Skeleton } from '@/components/ui';
import ForceGraph from '@/components/graph/ForceGraph';
import type { ImpactResult, GraphData, ServiceListItem } from '@/types';

function ImpactExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [selectedService, setSelectedService] = useState(searchParams.get('service') ?? '');
  const [depth, setDepth] = useState<1 | 2 | 3>(1);
  const [impactData, setImpactData] = useState<ImpactResult | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [fromService, setFromService] = useState('');
  const [toService, setToService] = useState('');
  const [pathResult, setPathResult] = useState<{ found: boolean; path: Array<{ id: string; name: string }>; hops: number } | null>(null);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingPath, setLoadingPath] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [errorImpact, setErrorImpact] = useState<string | null>(null);
  const [errorPath, setErrorPath] = useState<string | null>(null);

  // Load services for dropdowns
  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  // Load full graph
  useEffect(() => {
    setLoadingGraph(true);
    fetch('/api/graph')
      .then((r) => r.json())
      .then(setGraphData)
      .catch(() => {})
      .finally(() => setLoadingGraph(false));
  }, []);

  // Auto-load impact if service param is set
  useEffect(() => {
    if (selectedService) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedService) return;
    setLoadingImpact(true);
    setErrorImpact(null);
    setImpactData(null);

    // Update URL
    router.replace(`/impact?service=${selectedService}`);

    try {
      const res = await fetch(`/api/impact/${selectedService}?depth=${depth}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorImpact(data.message ?? 'Failed to analyze impact');
      } else {
        setImpactData(data);
      }
    } catch {
      setErrorImpact('Failed to analyze impact. Check database connection.');
    } finally {
      setLoadingImpact(false);
    }
  }, [selectedService, depth, router]);

  // Re-analyze when depth changes (if service selected)
  useEffect(() => {
    if (selectedService && impactData) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth]);

  const handleFindPath = async () => {
    if (!fromService || !toService) return;
    setLoadingPath(true);
    setErrorPath(null);
    setPathResult(null);

    try {
      const res = await fetch(`/api/path?from=${fromService}&to=${toService}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorPath(data.message ?? 'Failed to find path');
      } else {
        setPathResult(data);
      }
    } catch {
      setErrorPath('Failed to find path. Check database connection.');
    } finally {
      setLoadingPath(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Impact Explorer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          &ldquo;If this service changes, what else could be affected?&rdquo;
        </p>
      </div>

      {/* ── Impact Analysis ───────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Impact Analysis</h2>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Target Service
            </label>
            <select
              id="impact-service-selector"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Hop Depth
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  id={`depth-toggle-${d}`}
                  onClick={() => setDepth(d)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: depth === d ? 'var(--accent)' : 'var(--border)',
                    background: depth === d ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                    color: depth === d ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: depth === d ? 700 : 400,
                    fontSize: '13px',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            id="analyze-impact-btn"
            onClick={handleAnalyze}
            disabled={!selectedService || loadingImpact}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: selectedService && !loadingImpact ? 'var(--accent)' : 'var(--bg-elevated)',
              color: selectedService && !loadingImpact ? 'white' : 'var(--text-muted)',
              cursor: selectedService && !loadingImpact ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            {loadingImpact ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {/* Impact Results */}
        {loadingImpact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton height="80px" />
            <Skeleton height="120px" />
          </div>
        )}

        {errorImpact && <ErrorState message={errorImpact} onRetry={handleAnalyze} />}

        {impactData && !loadingImpact && (
          <ImpactResults data={impactData} />
        )}
      </div>

      {/* ── Force Graph ───────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Service Graph</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          CALLS relationships — click a node to view its detail
        </p>
        {loadingGraph ? (
          <Skeleton height="400px" />
        ) : graphData ? (
          <ForceGraph data={graphData} highlightId={impactData?.target.id} />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Graph unavailable
          </div>
        )}
      </div>

      {/* ── Shortest Path ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Shortest Path</h2>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              From
            </label>
            <select
              id="path-from-selector"
              value={fromService}
              onChange={(e) => setFromService(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">Select service…</option>
              {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          <div style={{ fontSize: '16px', color: 'var(--text-muted)', paddingBottom: '6px' }}>→</div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              To
            </label>
            <select
              id="path-to-selector"
              value={toService}
              onChange={(e) => setToService(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">Select service…</option>
              {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          <button
            id="find-path-btn"
            onClick={handleFindPath}
            disabled={!fromService || !toService || loadingPath}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: fromService && toService && !loadingPath ? 'var(--accent)' : 'var(--bg-elevated)',
              color: fromService && toService && !loadingPath ? 'white' : 'var(--text-muted)',
              cursor: fromService && toService && !loadingPath ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {loadingPath ? 'Finding…' : 'Find Path'}
          </button>
        </div>

        {/* Path results */}
        {errorPath && <ErrorState message={errorPath} />}

        {pathResult && !loadingPath && (
          <PathDisplay result={pathResult} />
        )}
      </div>
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>}>
      <ImpactExplorerContent />
    </Suspense>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ImpactResults({ data }: { data: ImpactResult }) {
  const { target, depth, impactedServices, affectedProjects, involvedTeams, externalIntegrations, summary } = data;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard label="Impacted Services" value={summary.totalImpacted} color="var(--accent)" />
        <SummaryCard label="Affected Projects" value={summary.projectCount} color="var(--node-project)" />
        <SummaryCard label="Teams Involved" value={summary.teamCount} color="var(--node-team)" />
        <SummaryCard label="External Systems" value={summary.externalCount} color="var(--node-external)" />
      </div>

      {/* Criticality breakdown */}
      <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Criticality Breakdown (at depth {depth})
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(summary.criticality).map(([crit, count]) => (
            count > 0 && <Badge key={crit} value={`${count} ${crit}`} variant="criticality" />
          ))}
          {Object.values(summary.criticality).every((v) => v === 0) && (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No services impacted</span>
          )}
        </div>
      </div>

      {/* Impacted services list */}
      {impactedServices.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Impacted Services
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {impactedServices.map((svc) => (
              <div
                key={svc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--accent-glow)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {svc.hops}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{svc.name}</span>
                <Badge value={svc.criticality} variant="criticality" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>hop{svc.hops !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {impactedServices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No services are impacted by changes to <strong style={{ color: 'var(--text-secondary)' }}>{target.name}</strong> at depth {depth}.
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '14px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function PathDisplay({ result }: { result: { found: boolean; path: Array<{ id: string; name: string }>; hops: number } }) {
  if (!result.found) {
    return (
      <div
        style={{
          padding: '20px',
          borderRadius: '8px',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        No dependency path found. These services are not connected through CALLS relationships.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Dependency path — {result.hops} hop{result.hops !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {result.path.map((node, idx) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: idx === 0 ? 'var(--accent-glow)' : idx === result.path.length - 1 ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${idx === 0 ? 'var(--accent)' : idx === result.path.length - 1 ? '#ef4444' : 'var(--border-strong)'}`,
                color: idx === 0 ? 'var(--accent-hover)' : idx === result.path.length - 1 ? '#f87171' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {node.name}
            </div>
            {idx < result.path.length - 1 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
