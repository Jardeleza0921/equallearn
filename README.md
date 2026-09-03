# EqualLearn — Phase 4 Appwrite Storage

This build adds Appwrite Storage to the current React + Expo EqualLearn rebuild. Firebase Authentication and Firestore remain unchanged as the main backend.

## Phase 4 additions

- Shared Appwrite Storage configuration for web and mobile
- Appwrite-backed profile pictures
- Teacher module attachment uploads
- Teacher lesson attachment uploads
- Mobile Android document picker
- Firestore file metadata synchronization
- Student web/mobile resource access through saved URLs
- Existing external resource URLs remain supported

See `docs/PHASE_4.md` for configuration and security notes.

# EqualLearn React + Expo Recreation — Phase 1

This is the clean replacement frontend built **beside** the current EqualLearn implementation.

## Locked architecture
- Web: React + Vite → Netlify
- Mobile: React Native + Expo
- Authentication: Firebase Authentication (Phase 2)
- Structured data: Cloud Firestore (Phase 2)
- File storage: Appwrite Storage (later phase)
- GitHub Pages: retired from the new architecture

## Phase 1 included
- Responsive React web shell
- Student, Teacher, and Admin workspace layouts
- React Native / Expo student shell
- Four themes: EqualLearn Default, PTC Dark Green, Purple, Pink
- Shared UX direction based on the supplied mobile demo
- Consistent Lucide icon family
- Web-only mobile app promotion

No Firebase data has been deleted or migrated.


## Phase 2.2 interaction polish
Public theme controls are visible without dropdowns; workspace themes stay in Settings. Sidebars collapse to icons, notification/profile popovers are interactive, profile photos have initials fallback, and Admin includes a safe Design Studio preview. Firebase remains unchanged.


## Phase 2.3
Navigation refinements and a safer, more organized Admin Design Studio are included. See `docs/PHASE_2_3.md`.


## Phase 2.8
Web profile alignment and section-based student management. Mobile remains unchanged.

## Phase 2.9
Academic profile cleanup across Student, Teacher, and Admin web views:
- Course is kept separate and fixed to BSIT for student registration/profile editing.
- Year Level is normalized to 1st, 2nd, 3rd, or 4th.
- Section is the student's current profile value and accepts 1 to 3 letters/numbers (examples: A, 3A, 3A1).
- Section lists are derived from current student profiles so stale cohort/group labels are not shown in the UI.
- Teacher/Admin student tables and reports display Course, Year Level, and Section as separate fields.
- Mobile remains unchanged.

## Phase 3
Mobile is now role-aware and connected to the same Firebase functionality as the React web app. Student, Teacher, and Admin mobile workspaces are implemented for local ADB/Expo testing. See `docs/PHASE_3.md`.

## Phase 3.2
Teacher assignment management is now named **Teacher Designations** and supports Activate, Deactivate, recoverable Delete, and Retrieve on both React web and React Native mobile.
