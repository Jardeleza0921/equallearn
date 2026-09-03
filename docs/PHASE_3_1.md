# EqualLearn Phase 3.1 — Lesson / Quiz Mobile Fix

Mobile-only maintenance pass after real-device ADB testing.

## Fixes
- Invalid placeholder URLs such as `N/A` are no longer rendered/opened as Android links.
- Optional module/lesson URLs are normalized when content is saved.
- All data-driven mobile screens refresh when revisited, fixing stale Expo Router tab data.
- Teacher Quiz Builder now starts from an actual lesson/material context.
- Teacher can review the selected lesson description/resource/video before writing questions.
- New lessons begin with their quiz unpublished.
- Teacher can explicitly publish/unpublish a lesson quiz after at least one question exists.
- Student quiz/module views only expose published lesson quizzes.
- Legacy lessons without a `quizPublished` field stay visible for backward compatibility.

No web files were changed in this pass.
