// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for GraphScope
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceStatus = 'active' | 'maintenance' | 'deprecated';
export type ServiceCriticality = 'critical' | 'high' | 'medium' | 'low';
export type ServiceType = 'frontend' | 'gateway' | 'backend';
export type ProjectStatus = 'active' | 'planning' | 'maintenance';
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type TechnologyCategory =
  | 'runtime'
  | 'language'
  | 'framework'
  | 'database'
  | 'search'
  | 'infrastructure'
  | 'cloud';
export type ExternalSystemType = 'payment' | 'logistics' | 'email' | 'crm';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
}

export interface Team {
  id: string;
  name: string;
  lead: string;
  department: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  status: ServiceStatus;
  version: string;
  environment: string;
  criticality: ServiceCriticality;
}

export interface Api {
  id: string;
  path: string;
  method: ApiMethod;
  description: string;
}

export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: ExternalSystemType;
}

// ── API Response shapes ──────────────────────────────────────────────────────

export interface ServiceListItem {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  criticality: ServiceCriticality;
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  connectionCount: number;
}

export interface ServiceDetail {
  service: Service;
  project: Project | null;
  team: Team | null;
  technologies: Array<Technology & { purpose: string }>;
  apis: Array<Api & { version: string }>;
  dependencies: Array<{ id: string; name: string; criticality: ServiceCriticality; protocol: string; latencyMs: number }>;
  dependents: Array<{ id: string; name: string; criticality: ServiceCriticality; protocol: string; latencyMs: number }>;
  externalIntegrations: Array<{ id: string; name: string; type: ExternalSystemType; protocol: string }>;
}

export interface ImpactResult {
  target: { id: string; name: string; criticality: ServiceCriticality };
  depth: number;
  impactedServices: Array<{ id: string; name: string; criticality: ServiceCriticality; hops: number }>;
  affectedProjects: Array<{ id: string; name: string }>;
  involvedTeams: Array<{ id: string; name: string }>;
  externalIntegrations: Array<{ id: string; name: string; type: ExternalSystemType }>;
  summary: {
    totalImpacted: number;
    criticality: { critical: number; high: number; medium: number; low: number };
    projectCount: number;
    teamCount: number;
    externalCount: number;
  };
}

export interface PathResult {
  found: boolean;
  path: Array<{ id: string; name: string }>;
  hops: number;
}

export interface GraphData {
  nodes: Array<{ id: string; name: string; type: 'service'; criticality: ServiceCriticality }>;
  edges: Array<{ source: string; target: string; type: 'CALLS'; protocol: string; latencyMs: number }>;
}

// ── Error codes ──────────────────────────────────────────────────────────────
export type ErrorCode =
  | 'INVALID_DEPTH'
  | 'INVALID_PARAMS'
  | 'SERVICE_NOT_FOUND'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface AppErrorResponse {
  code: ErrorCode;
  message: string;
}
