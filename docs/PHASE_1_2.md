# EqualLearn Phase 1.2 — Real UI Test Pass

This pass keeps Firebase/Firestore untouched and focuses on the new frontend.

## Included
- Softer Soft Green, PTC Forest, Soft Purple, and Soft Pink palettes
- PTC theme remains dark but with reduced saturation and contrast
- React web routes for the actual committed Student, Teacher, and Admin page structures
- Teacher Learning Content, Students, Quiz Builder, Analytics, Profile, Settings
- Admin Users, Teachers, Classes, Reports, Settings
- Student Learning, Quizzes, Progress, Profile, Settings
- Web Settings and frontend-only Logout preview
- Expo Settings and About screens; no self-advertising/install-app UI inside the mobile app
- React aligned to 19.1.0 across web/mobile workspace to avoid duplicate React in Expo

## Deliberately not done
- No Firebase project changes
- No Firestore collection/field changes
- No Firebase Auth mutation
- No Appwrite write integration yet
- No fake live metrics

The next step is local live-view testing, then safe frontend connection to the existing Firebase configuration.
