import type { Greeting } from "../../domain/entities/greeting";
import type { GreetingDto } from "../dto/greeting.dto";

/** Keeps entities out of components: the UI only ever sees DTOs. */
export function toGreetingDto(greeting: Greeting): GreetingDto {
  return {
    headline: greeting.headline,
    message: greeting.message,
  };
}
