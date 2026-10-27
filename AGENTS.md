## Project scope and ownership

- Follow `docs/architecture.md` and `docs/nj-cis-plan.md`; preserve the existing skeleton.
- The user and two teammates own **frontend only**. The boss owns backend services, authentication/authorization enforcement, database/RLS, private storage, email, background jobs, model integration, CIS mapping/PDF generation, and backend operations.
- Frontend API consumption, upload/session/error states, and integration verification belong to the frontend team. Record required backend contracts as dependencies; do not assign backend implementation to the three frontend members.
- Product views are **attorney** and **the attorney's own client**. Opposing parties/counsel are legal context or matter data, not additional product accounts, portals, navigation, or workspaces.
- Use `docs/team-frontend-handoff.md` for the original M1/M2/M3 business packages. First finish and jointly accept those frontend flows; then reassess and distribute UI improvements. Use `docs/project-roadmap-and-work-breakdown.md` for the current frontend roadmap.
- The broader legal research map is background, not authorization to build additional legal workflow modules.

## Git and action-item traceability

- Never create branch names starting with `codex/`. Use a descriptive name such as `feat/matter-intake-workflow`.
- Future commits must identify the relevant action-item IDs when they exist and describe the concrete changes, rather than only saying "complete frontend" or "fix UI".
- Commit bodies should list completed actions, verification actually performed, and remaining work/backend dependencies. Do not label an entire task complete when only part was delivered.
- PR descriptions must map action-item IDs to concrete outcomes, evidence, and any remaining work. Use `.github/pull_request_template.md`; for multiline `gh` bodies, use a body file.
- Keep commits focused. Do not rewrite existing commit history just to retrofit this convention unless requested.
- Do not push branches or create PRs without explicit user authorization.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
