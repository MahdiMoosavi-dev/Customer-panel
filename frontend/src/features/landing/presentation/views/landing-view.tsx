import { Container } from "@/shared/ui/container";
import { landingContainer } from "../../infrastructure/di/landing.container";
import { GreetingError } from "../components/greeting-error";
import { GreetingHero } from "../components/greeting-hero";

/**
 * Server Component that resolves the use case and picks a view for the
 * outcome. The route file stays a one-liner that renders this.
 */
export async function LandingView() {
  const result = await landingContainer.getGreeting();

  return (
    <main className="flex flex-1 items-center justify-center py-24">
      <Container>
        {result.ok ? (
          <GreetingHero greeting={result.value} />
        ) : (
          <GreetingError message={result.error.message} />
        )}
      </Container>
    </main>
  );
}
