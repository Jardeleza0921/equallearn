# EqualLearn Android App

The Capacitor Android app is linked to the live EqualLearn website. Website updates deployed to `https://jardeleza0921.github.io/equallearn/` appear in the app because the WebView loads that URL. Firebase Authentication and Firestore are therefore shared automatically.

For a downloadable APK without installing Android Studio locally, use the included GitHub Actions workflow `.github/workflows/build-android.yml`.
