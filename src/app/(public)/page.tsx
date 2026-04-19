import { LandingPage } from "@/modules/marketing/presentation/landing-page";

type PublicHomePageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function PublicHomePage({ searchParams }: PublicHomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <LandingPage success={params?.success} error={params?.error} />;
}