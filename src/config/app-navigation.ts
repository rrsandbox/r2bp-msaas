import type { Route } from "next";

export type AppNavigationItem = {
  href: Route | string;
  label: string;
  description?: string;
  permission?: string;
  showInMenu?: boolean;
  showInDashboard?: boolean;
  icon?: string;
};

export const appNavigationCatalog: AppNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Visao geral dos indicadores operacionais do tenant.",
    showInMenu: true,
    showInDashboard: false,
    icon: "📊",
  },
  {
    href: "/perfil",
    label: "Perfil",
    description: "Complete e mantenha seus dados cadastrais e de onboarding.",
    permission: "profile:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "🪪",
  },
  {
    href: "/tenants",
    label: "Clientes",
    description: "Gestao de clientes e configuracoes organizacionais.",
    permission: "tenant:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "🏢",
  },
  {
    href: "/atividades",
    label: "Atividades",
    description: "Fila operacional com aprovacoes, onboarding e pendencias administrativas.",
    permission: "task:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "✅",
  },
  {
    href: "/users",
    label: "Usuarios",
    description: "Cadastro e manutencao de usuarios por tenant.",
    permission: "user:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "👥",
  },
  {
    href: "/notificacoes",
    label: "Avisos",
    description: "Comunicados do sistema e mensagens operacionais do tenant.",
    permission: "notice:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "📣",
  },
  {
    href: "/suporte",
    label: "Suporte",
    description: "Abertura e acompanhamento de tickets operacionais.",
    permission: "support:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "🎫",
  },
  {
    href: "/agenda",
    label: "Agenda",
    description: "Eventos operacionais com filtros e fluxo de atualizacao.",
    permission: "agenda:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "📅",
  },
  {
    href: "/acessos",
    label: "Acessos",
    description: "Cadastro de features e permissao por usuario/tenant.",
    permission: "access:read",
    showInMenu: true,
    showInDashboard: true,
    icon: "🔐",
  },
];
