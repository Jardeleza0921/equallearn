# Phase 2.7 — Web Full Functionality Adaptation

This phase adapts the working behavior audited from the legacy/equallearn-update frontend into the current React web application.

## Scope

- Web only. The `mobile/` directory is unchanged from Phase 2.6.
- Existing Firebase Authentication and Firestore structure are reused as-is.
- No Firebase rules, collections, or existing data are migrated or renamed.
- Appwrite file upload is intentionally not implemented yet; existing URL-based resources remain supported.

## Student web

- Live dashboard from Firestore
- Class/teacher assignment information
- Learning module search/filtering
- Module detail + lessons/resources
- One-question-at-a-time quiz flow
- Quiz result persistence to `progress`
- Progress summary/history
- Editable student profile
- Existing settings/password security

## Teacher web

- Dashboard with live student/content/progress metrics
- Learning Content module CRUD
- Lesson CRUD and resource/video URLs
- Assigned-student filtering
- Student progress and quiz history
- Quiz Builder question CRUD
- Analytics / engagement based on real Firestore data
- Editable teacher profile

## Admin web

- Live dashboard counts
- User/student search and filtering
- Teacher creation/edit/deactivation/removal behavior
- Class group generation and teacher assignment
- Reports, grade filters, and CSV export
- Existing Design Studio preserved
- Account/security settings

## Shared web

- Firestore-backed notifications and read state
- Firebase session/role protection
- Real logout
- Password change + reset email
- Profile/initial fallback retained

## Important

Binary file upload is still deferred to Appwrite Storage. This phase does not re-enable Firebase Storage.
