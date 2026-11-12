# DESK-03 — demo entry forms

## Latest revision — 2026-11-11: role choices and returning client

Source: `99820e5432bdbd3caf736792ceae77190602839d`. The public `/` entry now offers Attorney and Client sign-in. Both sign-in forms expose the same role choices. New `/client/sign-in` supports returning-client email, sample-code, validation, expiry/reset, generic recovery and matching own-matter selection in the existing browser-memory demo.

Before captures in `client-return/before-*.png` were taken from the clean, unmodified `aadd27b191ff12031534fec26c52cb8229f16f3b` production build before the first edit. After captures use the final production build at the source commit above. The new client route had no prior screen: its baseline is the actual public `/` entry, explicitly shown below; no old client sign-in was reconstructed.

- DESK-03; roles: attorney and attorney's own client. Desktop Chromium 147.0.7727.15, device scale 1, 100% zoom; main 1440×900 and compact 1280×720.
- All images start at scroll (0, 0). Public/attorney initial pairs focus `body`; attorney validation/retry pairs focus `attorney-email` (retry has Demo controls open). New client email/code states focus the corresponding field; recovery/chooser focus `entry-title`.
- Synthetic data only: seeded John Smith / john.smith@example.com and unknown@example.com for recovery. Chooser uses an additional John Smith v. Taylor Demo matter, created and invited through the ordinary attorney UI in the same browser session.
- Four legacy `after-attorney-*.png` files are refreshed to include the role selector. Existing invitation images remain the unchanged invitation composition from `aadd27b`; its historical evidence and original baseline are retained below.

| Changed screen/state | Authentic before | Latest after |
| --- | --- | --- |
| Public role choices · 1440×900 | [Before `/`](client-return/before-role-selection-1440x900.png) | [After `/`](client-return/after-role-selection-1440x900.png) |
| Public role choices · 1280×720 | [Before `/`](client-return/before-role-selection-1280x720.png) | [After `/`](client-return/after-role-selection-1280x720.png) |
| Attorney sign-in · 1440×900 | [Before](client-return/before-attorney-sign-in-1440x900.png) | [After](after-attorney-empty-1440.png) |
| Attorney sign-in · 1280×720 | [Before](client-return/before-attorney-sign-in-1280x720.png) | [After](after-attorney-empty-1280.png) |
| Attorney required email · 1440×900 | [Before](client-return/before-attorney-invalid-1440x900.png) | [After](after-attorney-invalid-1440.png) |
| Attorney simulated retry · 1440×900 | [Before](client-return/before-attorney-retry-1440x900.png) | [After](after-attorney-retry-1440.png) |
| New client email · 1440×900 | [Existing entry `/` (new-route baseline)](client-return/before-role-selection-1440x900.png) | [Client email](client-return/after-client-email-1440x900.png) |
| New client email · 1280×720 | [Existing entry `/` (new-route baseline)](client-return/before-role-selection-1280x720.png) | [Client email](client-return/after-client-email-1280x720.png) |

| New client state | 1440×900 | 1280×720 |
| --- | --- | --- |
| Email validation | [Required-email error](client-return/after-client-email-invalid-1440x900.png) | — |
| Code entry | [Code entry](client-return/after-client-code-1440x900.png) | [Code entry](client-return/after-client-code-1280x720.png) |
| Code validation | [Empty](client-return/after-client-code-empty-1440x900.png), [Wrong](client-return/after-client-code-wrong-1440x900.png) | — |
| Code expiry / reset | [Expired](client-return/after-client-code-expired-1440x900.png), [Reset](client-return/after-client-code-reset-1440x900.png) | — |
| Generic recovery | [Recovery](client-return/after-client-recovery-1440x900.png) | [Recovery](client-return/after-client-recovery-1280x720.png) |
| Multiple matching matters | [Chooser](client-return/after-client-choose-matter-1440x900.png) | [Chooser](client-return/after-client-choose-matter-1280x720.png) |

The role choice makes client access findable from the public and attorney entry. Returning clients have a focused email/code task and adjacent recovery without needing to locate the original invitation. The compact code task includes its primary action, reset, return action and full demo disclosure within 1280×720.

Browser verification for this evidence exercised email validation; empty/wrong code; expiry/reset; valid John code to `/portal/matter-john` at both desktop sizes; generic unmatched-email recovery; and the chooser after preparing a second invitation through normal UI. All 19 after captures had meaningful page content, no framework overlay, no browser page errors or console errors, and no horizontal overflow. Regular local Playwright was used because the Browser plugin/skill was not available. Capture scripts and raw logs remain outside the repository. Screenshots do not prove production identity verification or server authorization.

## Earlier DESK-03 visual evidence

Authentic before captures were taken on unmodified base `b31143451826e0aa2de7d1a98a91f9ec352d0f5c` before editing either component. The original invitation after captures show the aadd27b visual revision; attorney after captures were refreshed as recorded above. No baseline was reconstructed.

- Browser: desktop Chromium 147.0.7727.15, device scale factor 1, 100% zoom.
- Main pair: 1440×900. Compact pair: 1280×720.
- Every pair uses scroll (0, 0) and the same focus: body for initial/invalid-link views; the relevant input for validation, retry and requested-code states.
- Data: synthetic Hartwell Family Law / Smith divorce / John Smith / john.smith@example.com; attorney entry uses eric@example.com. No real user records.
- Routes: `/sign-in`, `/invite/matter-john`, `/invite/invalid-token`.

## Original ticket baseline / delivered UI

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

The earlier PR revision is preserved in immutable commit `b71645b43f28ba0db016ff883aeec32a2bec1a51`: its `after-*.png` files are the last-reviewed comparison. Before these edits, a fresh 12-state browser capture of that clean revision matched those committed PNGs byte for byte. Duplicate captures were discarded; the original baseline images remain unchanged. The invitation `after-*.png` files retain that revision; attorney after images are refreshed as recorded in the latest section.

## Earlier verification (aadd27b revision)

- `npm test`: 43 passed.
- `npm run lint`, `npm run build`, `git diff --check`: passed.
- Chromium interactions: empty/malformed email, simulated failure, correction and Enter-key navigation to `/overview`; keyboard Demo controls opening, Escape closes and returns focus; keyboard code request, empty/short/nonnumeric/wrong code, expiry blocks even the correct code, reset clears error/value and focuses the field, `123456` enters the matching John and Sarah portals; invalid-link recovery returns to matters.
- Runtime measurements: 440px task column, 40px input, 44px primary; adjacent errors retain the action position within the same disclosure state.
- No horizontal overflow at 1280×720, 1280×800, 1440×900, 1920×1080, 320×740, 375×812, 414×896 or 768×1024. Focus outlines and final return-link access checked.
- 200% CSS zoom resilience checked; native browser zoom, Safari and Firefox were not exercised for this revision.
- No browser page errors in the 12-state capture or functional sweep.
- Independent reviewer inspected actual desktop screens and exercised attorney entry, client validation, expiry/reset and matching portal entry. Final compact sign-in text was simplified after the reviewer identified a contrast weakness over the photograph.

Email and code entry remain existing demo exercises: any valid email format and sample code `123456` work. They do not authenticate identity, send email or protect access. Real sessions, invitation validity and email delivery remain backend dependencies.
