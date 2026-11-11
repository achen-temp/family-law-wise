# DESK-03 — demo entry forms

Authentic before captures were taken on unmodified base `b31143451826e0aa2de7d1a98a91f9ec352d0f5c` before editing either component. After captures show the source delivered with this evidence. No baseline was reconstructed.

- Browser: desktop Chromium 147.0.7727.15, device scale factor 1, 100% zoom.
- Main pair: 1440×900. Compact pair: 1280×720.
- Every pair uses scroll (0, 0) and the same focus: body for initial/invalid-link views; the relevant input for validation, retry and requested-code states.
- Data: synthetic Hartwell Family Law / Smith divorce / John Smith / john.smith@example.com; attorney entry uses eric@example.com. No real user records.
- Routes: `/sign-in`, `/invite/matter-john`, `/invite/invalid-token`.

## Before / After

| State | Before | After |
| --- | --- | --- |
| Attorney, empty | [Before](before-attorney-empty-1440.png) | [After](after-attorney-empty-1440.png) |
| Attorney, required-email error | [Before](before-attorney-invalid-1440.png) | [After](after-attorney-invalid-1440.png) |
| Attorney, simulated retry | [Before](before-attorney-retry-1440.png) | [After](after-attorney-retry-1440.png) |
| Invitation, request code | [Before](before-invitation-request-1440.png) | [After](after-invitation-request-1440.png) |
| Invitation, code requested | [Before](before-invitation-code-1440.png) | [After](after-invitation-code-1440.png) |
| Invitation, empty code | [Before](before-invitation-empty-1440.png) | [After](after-invitation-empty-1440.png) |
| Invitation, wrong code | [Before](before-invitation-wrong-1440.png) | [After](after-invitation-wrong-1440.png) |
| Invitation, simulated expiry | [Before](before-invitation-expired-1440.png) | [After](after-invitation-expired-1440.png) |
| Invitation, reset | [Before](before-invitation-reset-1440.png) | [After](after-invitation-reset-1440.png) |
| Invalid invitation | [Before](before-invitation-not-found-1440.png) | [After](after-invitation-not-found-1440.png) |
| Attorney, compact desktop | [Before](before-attorney-empty-1280.png) | [After](after-attorney-empty-1280.png) |
| Invitation code, compact desktop | [Before](before-invitation-code-1280.png) | [After](after-invitation-code-1280.png) |

The forms now use centered 440px white sheets on the warm-gray canvas, 28px titles, 40px fields and 36px primary actions. Invitation context is an aligned list. Adjacent help/error space keeps the primary action in place when validation changes. Simulation controls are secondary; invalid-link copy gives client recovery guidance and labels attorney walkthrough links as demo-only. At 1280×720 the longer invitation scrolls naturally; the primary action remains visible and the return link remains reachable.

## Verification

- `npm test`: 43 passed.
- `npm run lint`: passed.
- `npm run build`: passed; existing remote Google Fonts require build network access.
- `git diff --check`: passed.
- Chromium interactions passed: empty/malformed email, simulated failure, correction and Enter-key navigation to `/overview`; keyboard code request, empty/short/nonnumeric/wrong code, expiry even with the correct code, reset clears error/value and focuses the field, `123456` enters the matching John and Sarah portals; invalid link recovery returns to matters.
- Runtime measurements: sheet 440px, input 40px, primary 36px; primary Y position unchanged across every validation state in each form.
- No horizontal overflow at 1280×720, 1280×800, 1440×900 or 1920×1080. Focus outlines and scroll access to final return links checked.
- 200% CSS zoom resilience checked; native browser zoom, Safari and Firefox were not exercised.
- No browser page errors in before/after or functional checks.
- An independent reviewer inspected the actual desktop forms and exercised entry, validation, expiry/reset and invalid-link paths; no concrete blocker found.

Email and code entry remain existing demo exercises: any valid email format and sample code `123456` work. They do not authenticate an identity, send email or protect access. Real sessions, invitation validity and email delivery remain backend dependencies.
