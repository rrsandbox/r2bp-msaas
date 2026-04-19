export const systemManifest = {
  architecture: "clean-architecture-pragmatica",
  organization: "bounded-context-by-module",
  tenants: "isolamento por tenant_id e guards na camada de aplicacao",
  auth: "authjs + prisma + two-factor-email + trusted-browser",
  observability: "logs estruturados + metricas + tracing",
  backgroundProcessing: "jobs e locks persistidos em postgres",
} as const;