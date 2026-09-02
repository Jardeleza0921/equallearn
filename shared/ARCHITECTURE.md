# Canonical architecture

React Web ─────────────┐
                       ├── Firebase Authentication
React Native / Expo ───┤
                       ├── Cloud Firestore
                       │
                       └── Appwrite Storage

Netlify is the official web host. GitHub remains source control and CI/CD.
