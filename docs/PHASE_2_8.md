# Phase 2.8 — Profile and Section Management

Web-only refinement. Mobile is unchanged.

- Unified profile views: picture, role, section, email, phone, bio.
- Local profile-photo preview remains available until Appwrite storage is connected.
- Student-facing Cohort/Group wording is presented as Section without forcing a Firebase data migration.
- Admin and Teacher student tables can open aligned profile details.
- Admin and Teacher can remove a student Firestore profile and saved progress/notifications. Firebase Authentication deletion still requires a privileged backend/Admin SDK.
- Admin Classes UI is renamed to Sections while retaining the existing Firestore collection for compatibility.
- Teacher profile and Admin teacher profile management now include phone and bio.
