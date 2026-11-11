# DESK-04 · Settings and templates desktop evidence

Baseline: `b31143451826e0aa2de7d1a98a91f9ec352d0f5c` (remote dev). Before screenshots were captured from that exact production build before the first source edit. After screenshots show the production build committed alongside these files.

All images use synthetic Hartwell Family Law / Alex Morgan seed data, Attorney role, Chrome for Testing, 100% zoom, device scale factor 1, light appearance, page scroll (0,0), body focus, pointer at the lower-right viewport corner. The default main pair is 1440×900; compact is 1280×720. Metadata records HTTP 200, zero page errors, and no horizontal overflow for every capture.

| Route / state | Before | After |
| --- | --- | --- |
| `/settings` · default | [Before](before-settings.png) | [After](after-settings.png) |
| `/settings` · invalid attorney email (`invalid`) | [Before](before-settings-firm-error.png) | [After](after-settings-firm-error.png) |
| `/settings` · second reminder set to 1, following first reminder 3 | [Before](before-settings-reminder-error.png) | [After](after-settings-reminder-error.png) |
| `/settings` · both original save actions submitted with seed values | [Before](before-settings-saved.png) | [After](after-settings-saved.png) |
| `/templates` · supported template and unsupported list | [Before](before-templates.png) | [After](after-templates.png) |
| `/settings` · compact desktop | [Before](before-settings-compact.png) | [After](after-settings-compact.png) |
| `/templates` · compact desktop | [Before](before-templates-compact.png) | [After](after-templates-compact.png) |

Settings now reads top to bottom in one 760px sheet. Firm details and reminder defaults have distinct section headings, field groups and save rows. Each result remains beside its own save action. The schedule is explicitly measured from the request date, and remains a preview with no notifications. Compact desktops use normal page scrolling; the schedule save remains reachable.

Templates now separates the sole active NJ Divorce template's scope and fixed demo periods in a 320px summary from the read-only requirements. Conditional request rules have their own rows. Possible-account review is separate from generated document requests and explicitly does not claim file extraction. Unsupported templates are a secondary text list, with no edit actions.

## Verification

- `npm run lint`: passed, zero warnings/errors.
- `npm test`: all 43 existing tests passed, including firm details and reminder validation.
- `npm run build`: passed, including TypeScript and static generation. Existing build-time Google Fonts requests required network access.
- Actual production Chromium: blank/whitespace firm and attorney names, invalid email, blank/zero/fractional/unsafe reminder numbers, reminder ordering, and exact invalid-input focus passed. Changing an input clears only its own section's feedback.
- Keyboard Enter submitted each form. Saving one section preserved the other section's unfinished values and feedback. Saved values survived in-app navigation and reset after reload.
- `/templates`: read-only content, fixed January–March 2026 statement periods for each reported account, original tax-year/conditional rules, and separate unconfirmed-account review note checked.
- Both routes checked at 1280×720, 1280×800, 1440×900 and 1920×1080: no horizontal overflow; form actions reachable by focus and scrolling. No uncaught page errors.
- Safari, Firefox, 200% browser zoom and live backend integration were not run. This evidence covers these two attorney management pages, not whole-product acceptance.

## Review task

At `/settings`, enter an invalid attorney email and save Firm; focus should move to the email with an error in the Firm save row. Fix it and save, then enter an out-of-order reminder schedule; the schedule error should stay in Reminder defaults, with focus on the first invalid schedule field. Save valid values, navigate away/back, then reload to observe the preview-session reset.

At `/templates`, identify the only supported template, which periods are requested for each reported bank account, and how the possible-account review rule differs from an automatic request. There is no template editor.

Independent second review passed: the reviewer read both component diffs, viewed original Before/After settings, templates and reminder-error images at full size, and used the production pages to check blank-name/email focus, zero/out-of-order reminder focus, independent save results, sidebar update, navigation retention and reload reset. No concrete blocker was found.

The existing in-memory store and validation functions remain unchanged. Durable firm-setting persistence, authorization, real reminder scheduling/delivery and their failure contracts remain backend dependencies owned by the boss.
