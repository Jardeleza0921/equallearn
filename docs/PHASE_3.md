# Phase 3 — Mobile Full Functionality

Phase 3 turns the Expo application from a student-first mockup into a role-aware Firebase application for Student, Teacher, and Admin accounts.

## Shared mobile functionality
- Firebase Authentication session persistence.
- Role routing after login.
- Student registration using the existing `users` + `classGroups` structure.
- Password reset.
- Theme persistence with AsyncStorage.
- Real Firestore notifications on role home screens.
- Profile editing and real password change/reset controls.
- Existing Firebase collections and field names remain unchanged.

## Student
- Live home statistics and teacher/section lookup.
- Firestore modules, lessons, resource links, and video links.
- Real quiz list and one-question-at-a-time quiz attempts.
- Quiz results saved to `progress`.
- Progress history and retakes.
- Editable academic profile: BSIT, 1st–4th Year Level, 1–3 character Section, phone, bio.

## Teacher
- Live dashboard and engagement metrics.
- Learning Content: module and lesson create/edit/delete.
- URL-based module/lesson resources while Appwrite Storage is pending.
- Assigned student list and student profile/history view.
- Student Firestore-profile deletion flow with explicit Firebase Auth limitation.
- Quiz Builder: question create/edit/delete.
- Live analytics.
- Editable teacher profile.

## Admin
- Live system dashboard.
- Student search/profile/history/delete.
- Teacher account creation and profile edit/delete.
- Section generation from current student profiles.
- Teacher-to-section/year assignment and assignment deactivation.
- Student performance reports with native Share-based CSV output.
- Editable admin profile.

## Intentionally not faked
- Binary PDF/image upload remains pending Appwrite Storage.
- Browser-local Web Design Studio settings are not represented as shared mobile controls because they are not stored in a shared backend yet.
- Deleting another user's Firebase Authentication credential still requires privileged server/Admin SDK access; mobile deletion removes the Firestore-side EqualLearn profile/data only.

## Validation performed in build artifact
- All JS/JSX files parsed successfully with TypeScript's JavaScript/JSX parser.
- All relative imports were checked and resolve to files in the package.
- Runtime testing must still be performed on the user's ADB-connected Android device with Expo Go.
