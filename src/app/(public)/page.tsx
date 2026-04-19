import { LandingPage } from "@/modules/marketing/presentation/landing-page";
import { listLatestLandingComments } from "@/modules/marketing/application/public-comment-service";

type PublicHomePageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function PublicHomePage({ searchParams }: PublicHomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const testimonials = await listLatestLandingComments(20);

  return <LandingPage success={params?.success} error={params?.error} testimonials={testimonials} />;
}