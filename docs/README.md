# Customer Panel — Documentation

> Last updated: 2026-08-16

Reference documentation for the Customer Panel monorepo. The `README.md` files in the repo root, `frontend/`, and `backend/` are **quick-start** material — how to install and run. These docs are the **reference** — what the app is, how it is put together, why, and how to extend it without breaking the shape.

## Contents

| Doc                                            | Read it when                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| [01 — Overview](01-overview.md)                | You are new here, or need to know what exists today vs. what doesn't |
| [02 — Architecture](02-architecture.md)        | You need the layer model, the dependency rule, and how a request flows |
| [03 — Project structure](03-project-structure.md) | You are asking "where does this file go?"                       |
| [04 — Patterns](04-patterns.md)                | You are writing code and want the house pattern for it            |
| [05 — Technologies](05-technologies.md)        | You need versions, why a tool was picked, or its known gotchas    |
| [06 — Conventions](06-conventions.md)          | You need naming, imports, errors, styling, testing rules          |
| [07 — Workflows](07-workflows.md)              | You want a step-by-step recipe for a common task                  |
| [08 — Decisions](08-decisions.md)              | You want to know *why* something is the way it is, before changing it |
| [CHANGELOG](CHANGELOG.md)                      | You want the history of what each session changed                 |

---

## Keeping these docs current

**The rule: a session that changes part of the project updates the docs for that part in the same session, before it reports the work as done.** Documentation is part of the change, not a follow-up task. A doc that lies is worse than no doc, because it gets trusted.

This applies to every contributor, human or agent. Agent sessions pick it up automatically through the repo root [AGENTS.md](../AGENTS.md), which is loaded at the start of every session.

### What to update when

| If you change…                                              | Update                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Anything at all                                              | [CHANGELOG.md](CHANGELOG.md) — one entry per session                    |
| Added / removed / renamed a feature slice                    | [01-overview](01-overview.md), [03-project-structure](03-project-structure.md) |
| Added / moved a folder, or changed the layer layout          | [03-project-structure](03-project-structure.md)                         |
| Introduced a recurring pattern, or changed an existing one   | [04-patterns.md](04-patterns.md)                                        |
| Changed how layers may depend on each other, or a lint boundary rule | [02-architecture](02-architecture.md), [06-conventions](06-conventions.md) |
| Added / removed / upgraded a dependency, or changed a tool's config | [05-technologies](05-technologies.md)                            |
| Added a naming rule, import rule, or formatting rule         | [06-conventions.md](06-conventions.md)                                  |
| Added an API endpoint or a route                             | [02-architecture](02-architecture.md) (flow), `backend/README.md` (endpoint table) |
| Added a script to any `package.json`                         | root `README.md`, [07-workflows](07-workflows.md)                       |
| Added an environment variable                                | the owning app's `.env.example` and `README.md`, [06-conventions](06-conventions.md) |
| Made a choice a future reader could reasonably question      | [08-decisions.md](08-decisions.md) — add an ADR                         |
| Reversed an earlier decision                                 | [08-decisions.md](08-decisions.md) — mark the old ADR `Superseded`, add the new one |

### Definition of done for any change

```
[ ] npm run typecheck   passes
[ ] npm run lint        passes   (includes the architecture boundary rules)
[ ] npm test            passes
[ ] npm run build       passes
[ ] docs updated per the table above
[ ] CHANGELOG.md entry added
[ ] "Last updated" bumped on every doc you touched
```

### How to write these docs

- **Link, don't copy.** Code is the source of truth for detail. Reference a file (`backend/src/main.ts`) instead of pasting a block that will silently drift. Code samples are for *shape and intent*, and should stay short enough to survive refactors.
- **Say why, not just what.** The folder tree is discoverable from the filesystem; the reason for it is not.
- **Record what is deliberately missing.** "There is no auth yet" is information. So is "we chose not to share `core/`".
- **Fix contradictions on sight.** If you find a doc that disagrees with the code while working on something else, correct it in that session — it is a two-minute job that stops compounding.
- **Keep the audience in mind:** a competent developer who has never seen this repo, arriving on a Monday morning.
