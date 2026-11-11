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

The attorney entry now uses a two-column desktop composition: the existing W brand and a serif financial-disclosure heading over an original folder-and-paper still life on the left; a focused 440px task column on the right. The primary action is 44px tall. QA simulation is inside an optional “Demo controls” disclosure with keyboard opening and Escape-to-close focus recovery. Below 900px the decorative introduction is omitted so the form follows the brand immediately.

The invitation uses the same split, with the actual shared-store firm, matter and recipient on the left and the code/request/error/recovery task on the right. Missing invitations have specific recovery guidance. Nothing adds authentication or email delivery.

The earlier PR revision is preserved in immutable commit `b71645b43f28ba0db016ff883aeec32a2bec1a51`: its `after-*.png` files are the last-reviewed comparison. Before these edits, a fresh 12-state browser capture of that clean revision matched those committed PNGs byte for byte. Duplicate captures were discarded; the original baseline images remain unchanged. The current `after-*.png` files show the revised source.

## Verification

- `npm test`: 43 passed.
- `npm run lint`, `npm run build`, `git diff --check`: passed.
- Chromium interactions: empty/malformed email, simulated failure, correction and Enter-key navigation to `/overview`; keyboard Demo controls opening, Escape closes and returns focus; keyboard code request, empty/short/nonnumeric/wrong code, expiry blocks even the correct code, reset clears error/value and focuses the field, `123456` enters the matching John and Sarah portals; invalid-link recovery returns to matters.
- Runtime measurements: 440px task column, 40px input, 44px primary; adjacent errors retain the action position within the same disclosure state.
- No horizontal overflow at 1280×720, 1280×800, 1440×900, 1920×1080, 320×740, 375×812, 414×896 or 768×1024. Focus outlines and final return-link access checked.
- 200% CSS zoom resilience checked; native browser zoom, Safari and Firefox were not exercised for this revision.
- No browser page errors in the 12-state capture or functional sweep.
- Independent reviewer inspected actual desktop screens and exercised attorney entry, client validation, expiry/reset and matching portal entry. Final compact sign-in text was simplified after the reviewer identified a contrast weakness over the photograph.

Email and code entry remain existing demo exercises: any valid email format and sample code `123456` work. They do not authenticate identity, send email or protect access. Real sessions, invitation validity and email delivery remain backend dependencies.
