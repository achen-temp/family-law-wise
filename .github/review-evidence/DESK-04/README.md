# DESK-04 · Practice settings and template catalogue

Original baseline: `b31143451826e0aa2de7d1a98a91f9ec352d0f5c`. Original Before captures are preserved. Last reviewed implementation: `62ede420ddf59947ea0d7b6e4c277a7e7b4138fa`. Before this revision's first source edit, all seven last-reviewed screenshots were reproduced from its actual production build. Every PNG matched the prior committed image byte for byte; SHA-256 evidence is in `capture-metadata.json`. The table links directly to those original images rather than storing duplicates.

All matched images use synthetic Hartwell Family Law / Alex Morgan seed data, Attorney role, Chrome for Testing, 100% zoom, device scale factor 1, light appearance, scroll (0,0), body focus, pointer at the lower-right corner. Main pairs are 1440×900, compact pairs 1280×720. The supplementary full-page template image starts at 1440×900 and includes the entire catalogue. Every matched capture returned HTTP 200 with no page errors or horizontal overflow.

| Route / state | Original Before | Last reviewed | Revised After |
| --- | --- | --- | --- |
| `/settings` · default | [Before](before-settings.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-settings.png) | [After](after-settings.png) |
| `/settings` · attorney email `invalid` | [Before](before-settings-firm-error.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-settings-firm-error.png) | [After](after-settings-firm-error.png) |
| `/settings` · second reminder 1 after first reminder 3 | [Before](before-settings-reminder-error.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-settings-reminder-error.png) | [After](after-settings-reminder-error.png) |
| `/settings` · both seed values saved | [Before](before-settings-saved.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-settings-saved.png) | [After](after-settings-saved.png) |
| `/templates` · default | [Before](before-templates.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-templates.png) | [After](after-templates.png) |
| `/settings` · compact | [Before](before-settings-compact.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-settings-compact.png) | [After](after-settings-compact.png) |
| `/templates` · compact | [Before](before-templates-compact.png) | [Previous](https://github.com/achen-temp/family-law-wise/blob/62ede420ddf59947ea0d7b6e4c277a7e7b4138fa/.github/review-evidence/DESK-04/after-templates-compact.png) | [After](after-templates-compact.png) |

Supplementary final states: [simultaneous compact errors](after-settings-errors-compact.png), [both compact save results](after-settings-saved-compact.png), [complete template catalogue](after-templates-full.png). These supplement the matched pairs rather than claiming a reconstructed baseline for new captures.

## What became easier

Settings restores two peer forms across the desktop width instead of the last-reviewed narrow stack. Both original saves remain fully visible at 1280×720, including simultaneous validation errors or both success messages. Reminder rows pair each named step with a right-sized numeric input and visible days unit. Their measurement from the original request date and preview-only status are explicit. Each form's 44px save stays beside its own feedback. Unsubmitted edits show an unsaved indicator; an exact revert clears it. Idle forms have no misleading status text.

Templates identifies the supported read-only NJ Divorce template in a full-width dossier with its fixed tax year and demo reference date. A two-column catalogue separates the client condition from the requested documents. The bank row makes January, February and March 2026 easy to scan. Copy matches `src/lib/requirements.ts`: tax filing default, employment-only bonus and commission additions, named investment/retirement/business details, bank/card identifiers, mortgage plus property tax, loan statements, and insurance policy/cash-value evidence. It does not claim these are independently verified legal requirements. Possible-account findings are explicitly unconfirmed; asking or dismissing does not confirm an account. No editor, template selector, extra account or backend action was added.

## Verification

- `npm test`: all 43 existing tests passed.
- `npm run lint`: passed without warnings/errors.
- `npm run build`: passed, including TypeScript and static generation.
- Production Chromium: blank/whitespace firm and attorney names, invalid email, blank/zero/fractional/unsafe reminder numbers, reminder ordering and exact invalid-input focus passed.
- Keyboard: Tab order and visible 2px focus outline checked for all six inputs and both saves. Enter submitted each form.
- Saving either section preserved the other section's unfinished values and feedback. Saved data survived in-app navigation and reset on reload. Exact field reversion cleared unsaved indicators in both forms.
- At 1280×720, default, simultaneous errors, and both saved results kept both 44px actions completely within the initial viewport. Both routes also checked at 1280×800, 1440×900 and 1920×1080 without horizontal overflow or page errors.
- All ten catalogue conditions and document descriptions checked in the production DOM against the requirement-engine source; templates remain read-only. Lower catalogue, possible-account review and unsupported list inspected in the full-page capture.
- Independent design reviewer viewed the actual pages and images at compact and main widths, exercised simultaneous errors and exact focus, and approved the final composition after requesting the visible days rows and compact save footers.
- Self-critique covered source accuracy, exact-revert behavior, independent form state, keyboard/compact accessibility, scope and simplicity. Source changes remain limited to the two view components.
- Safari, Firefox, 200% zoom and live backend integration were not run. These checks cover these two attorney practice pages only.

## Review task and dependencies

At `/settings`, change and exactly revert a field in each section; the unsaved indicator should clear. Enter an invalid email and a second reminder of 1, submit each and verify separate errors/focus. Save valid values, navigate away/back, then reload to observe the preview reset. Both actions and results should remain visible on a 1280×720 desktop.

At `/templates`, find the bank statement periods, documents requested for owned property, life insurance and a business interest, and explain how a possible-account finding differs from a confirmed account. The page has no template edit action.

The existing in-memory store and validators are unchanged. Durable settings persistence, authorization, real reminder scheduling/delivery and their API/failure contracts remain backend dependencies owned by the boss.
