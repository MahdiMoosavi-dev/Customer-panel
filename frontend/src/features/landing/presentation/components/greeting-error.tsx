interface GreetingErrorProps {
  message: string;
}

export function GreetingError({ message }: GreetingErrorProps) {
  return (
    <section className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-base text-foreground/60">{message}</p>
    </section>
  );
}
