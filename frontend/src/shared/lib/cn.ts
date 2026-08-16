type ClassValue = string | number | null | undefined | false;

/** Joins conditional class names without pulling in a dependency. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
