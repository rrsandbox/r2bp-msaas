import { requirePageAuth } from "@/lib/auth/authorization";
import { listNavigationByArea } from "@/lib/navigation/runtime-navigation";
import { AppLayout } from "@/ui/components";

export default async function AppLayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await requirePageAuth();
  const availableNavigation = await listNavigationByArea(context, "menu");

  return (
    <AppLayout
      navigationItems={availableNavigation}
      appName="R2BP"
      currentTenant={context.tenantName ?? "Tenant Sistema"}
      role={context.role}
      isProfileComplete={context.isProfileComplete}
      tenantOnboardingStatus={context.tenantOnboardingStatus}
    >
      {children}
    </AppLayout>
  );
}