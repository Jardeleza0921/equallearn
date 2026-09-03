# Phase 2 — Existing Firebase Authentication

This phase connects the approved React web and Expo mobile frontends to the existing EqualLearn Firebase project without changing Firebase infrastructure.

## Connected
- Firebase Authentication login
- Existing `users/{uid}` profile lookup
- Existing role values: admin / teacher / student
- Existing inactive-account blocking
- Existing `lastLogin` update
- Web protected routes by role
- Real Firebase logout
- Web password reset email
- Web student registration using the committed fields and `classGroups` behavior
- Expo Firebase login and persistent session storage
- Expo student profile identity

## Intentionally not changed
- Firebase project
- Firestore collection names/field names
- Firebase rules
- Existing accounts/data
- Firebase Storage (still not used in the new frontend)

## Next
Phase 3 replaces Student mock learning data with the existing Firestore modules, lessons, questions, and progress data.
