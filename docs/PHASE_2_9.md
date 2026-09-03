# EqualLearn Phase 2.9 — Academic Profile Cleanup

Web-only refinement before mobile development.

## Canonical student academic values
- Course: `BSIT`
- Year Level: `1st`, `2nd`, `3rd`, `4th`
- Section: 1–3 alphanumeric characters, normalized uppercase (examples: `A`, `3A`, `3A1`)

## What changed
- Student profile edits now save the `section` field directly, fixing the old mismatch where an edited cohort could be hidden by a stale section value.
- Student registration now asks for Section and uses only the four supported year levels.
- Student, Teacher, and Admin web views display Course, Year Level, and Section separately.
- Teacher student visibility and student assignment matching use the current profile Section + Course + Year Level.
- Admin Sections derives visible sections from current student profiles so unused historical class-group records do not clutter the page.
- Reports/CSV export include separate Course, Year Level, and Section columns.

## Compatibility
Legacy `cohort` values are read only as a fallback for older student/assignment records. New and edited student profiles use `section` as the canonical value.

## Mobile
No mobile files were changed in Phase 2.9.
