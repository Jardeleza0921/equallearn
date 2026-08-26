# EqualLearn update

## Interface and responsiveness
- Added a cleaner EqualLearn loading screen with the logo, name, animated progress rail, and responsive mobile layout.
- Added fast page-transition feedback between Admin, Teacher, and Student pages.
- Improved module and lesson card grids so they automatically fit desktop, tablet, and phone widths.
- Improved mobile modals into touch-friendly bottom sheets with larger form controls and buttons.
- Improved file inputs, upload panels, progress feedback, and dark-mode compatibility.

## Faster module and file workflow
- Module uploads continue to use Firebase resumable uploads and now show percentage, transferred size, upload speed, and estimated time remaining.
- Lesson uploads were upgraded from a basic one-shot upload to Firebase resumable uploads.
- Added cancel-upload controls and clearer upload errors.
- Module editing/deleting now uses an in-memory cache instead of downloading the entire module collection again.
- Added a small local module cache so previously loaded modules can appear immediately while Firestore refreshes in the background.
- Module and lesson lists use batched DOM rendering to reduce unnecessary page work.
- Removed artificial waiting after module saves; successful changes appear immediately and sync in the background.
- Replaced uploaded files are cleaned up from Firebase Storage when possible.

## Performance
- Updated the service worker cache to include the main UI, loading screen, password toggle, and app icons.
- Static assets use cache-first loading with background refresh for faster repeat visits.
- Kept the system-font UI and local SVG icons so the interface does not depend on font/icon CDNs.

## Existing features kept
- Responsive website and Android/Capacitor support.
- Desktop APK introduction section.
- EqualLearn wordmark/logo treatment.
- Show/hide password controls.
- Same Firebase project and role-based Admin, Teacher, and Student behavior.
