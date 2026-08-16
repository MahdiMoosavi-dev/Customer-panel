import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/** Feature-agnostic layout primitive: horizontal rhythm for page content. */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl px-6", className)}>
      {children}
    </div>
  );
}
