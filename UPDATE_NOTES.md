# EqualLearn Update Notes

This update focuses on classroom usability, responsiveness, and the PTC-inspired green visual system.

- Direct APK install link from the website using the mobile-latest GitHub Release.
- Live teacher Class Engagement metrics from Firestore progress records.
- Better Teacher student controls with search, filters, performance summary, and learning record drawer.
- Editable Student and Teacher profiles.
- New Student Quizzes tab with completion and score information.
- Teacher Modules and Lessons merged into one Learning Content workspace.
- Quiz Builder redesigned with search, lesson filtering, editing, deletion, and clearer question previews.
- Light theme uses a clean PTC-inspired green palette with visible borders.
- Dark theme uses green outlines and stronger contrast.
- Updated EqualLearn wordmark, app icon, splash screen, and SVG interface icons.
- Responsive layouts improved for phones, tablets, and desktop.

## Netlify preview, APK, and public information pages
- Added `about.html` with an overview of EqualLearn and its student, teacher, and administrator workspaces.
- Added `developers.html` listing the five PTCian developers provided for the project.
- Added host-aware APK download links: Netlify uses the `mobile-preview` release; the stable site uses `mobile-latest`.
- Added `/apk` Netlify redirect for a short direct-download URL.
- The Android workflow now builds automatically from both `main` and `equallearn-update`.
- Preview APK builds point to `https://equallearn.netlify.app/`; main builds keep the stable GitHub Pages URL.


## Netlify direct APK deployment
- The `equallearn-update` branch now builds a preview APK and deploys it directly with the website to Netlify.
- Visitors download `https://equallearn.netlify.app/downloads/EqualLearn.apk` (or `/apk`) and do not need GitHub Artifacts or Releases.
- Repository secrets required: `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.
- Learning Content modals are now true overlays; redundant X controls were removed, save/cancel buttons were polished, and the theme toggle no longer overlaps the topbar.
