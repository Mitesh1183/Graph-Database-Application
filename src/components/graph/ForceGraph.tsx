'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { GraphData } from '@/types';

const CRIT_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const LEGEND_ITEMS = [
  { color: '#ef4444', label: 'Critical' },
  { color: '#f97316', label: 'High' },
  { color: '#eab308', label: 'Medium' },
  { color: '#22c55e', label: 'Low' },
];

interface Props {
  data: GraphData;
  highlightId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGraph = any;

export default function ForceGraph({ data, highlightId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<AnyGraph>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let mounted = true;

    import('react-force-graph-2d').then((mod) => {
      if (!mounted || !containerRef.current) return;
      if (!data?.nodes?.length) return; // guard: no data yet

      // Dynamically require react-dom/client to avoid SSR
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createRoot } = require('react-dom/client');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const React = require('react');

      const ForceGraph2D: AnyGraph = mod.default;

      // Prepare graph data
      const nodes = data.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        criticality: n.criticality,
        color: highlightId === n.id ? '#ffffff' : (CRIT_COLORS[n.criticality] ?? '#3b82f6'),
      }));
      const links = data.edges.map((e) => ({
        source: e.source,
        target: e.target,
        protocol: e.protocol,
        latencyMs: e.latencyMs,
      }));

      const graphData = { nodes, links };
      const width = containerRef.current!.offsetWidth || 800;

      containerRef.current!.innerHTML = '';
      const wrapper = document.createElement('div');
      containerRef.current!.appendChild(wrapper);

      if (graphInstanceRef.current) {
        try { graphInstanceRef.current.unmount(); } catch { /* ignore */ }
      }

      const root = createRoot(wrapper);
      graphInstanceRef.current = root;

      const element = React.createElement(ForceGraph2D, {
        graphData,
        width,
        height: 420,
        backgroundColor: '#111118',
        nodeLabel: (node: AnyNode) => `${node.name ?? ''} (${node.criticality ?? ''})`,
        nodeColor: (node: AnyNode) => node.color ?? '#3b82f6',
        nodeRelSize: 5,
        linkColor: () => 'rgba(148,163,184,0.3)',
        linkWidth: 1.5,
        linkDirectionalArrowLength: 6,
        linkDirectionalArrowRelPos: 1,
        linkDirectionalParticles: 1,
        linkDirectionalParticleSpeed: 0.004,
        onNodeClick: (node: AnyNode) => {
          if (node.id) router.push(`/services/${String(node.id)}`);
        },
        nodeCanvasObject: (node: AnyNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const name = String(node.name ?? '');
          const color = String(node.color ?? '#3b82f6');
          const isHighlight = String(node.id) === highlightId;
          const radius = isHighlight ? 9 : 6;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          if (isHighlight) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (globalScale > 0.6) {
            const fontSize = Math.max(10 / globalScale, 10);
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(241,245,249,0.9)';
            ctx.fillText(name, x, y + radius + 2);
          }
        },
      });

      root.render(element);
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, highlightId]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '420px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      />
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '1px',
              background: 'rgba(148,163,184,0.5)',
              flexShrink: 0,
            }}
          />
          CALLS
        </div>
      </div>
    </div>
  );
}
