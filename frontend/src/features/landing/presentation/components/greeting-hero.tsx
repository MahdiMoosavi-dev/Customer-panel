import type { GreetingDto } from "../../application/dto/greeting.dto";

interface GreetingHeroProps {
  greeting: GreetingDto;
}

/** Presentational only: receives a DTO, renders it, holds no logic. */
export function GreetingHero({ greeting }: GreetingHeroProps) {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium tracking-wide text-foreground/60 uppercase dark:border-white/15">
        Next.js · Clean Architecture
      </span>
      <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        {greeting.headline}
      </h1>
      <p className="max-w-md text-base text-pretty text-foreground/60">
        {greeting.message}
      </p>
    </section>
  );
}
