# EqualLearn

EqualLearn is a responsive learning management website for administrators, teachers and students. It uses the `equallearn-test` Firebase project for Authentication and Cloud Firestore.

## Demo account setup
After deploying the files, open `setup-accounts.html` once and click **Create / repair all three accounts**. It prepares:

- `admin@equallearn.com` — administrator
- `teacher@equallearn.com` — teacher
- `student@equallearn.com` — student
- Shared password: the password entered on the setup page

Delete `setup-accounts.html` and `assets/js/setup-accounts.js` after setup.

## Website
The project is ready for GitHub Pages and Netlify. Student registration accepts any valid email address.

## Android
The Android wrapper is configured to load the live GitHub Pages website at:

`https://jardeleza0921.github.io/equallearn/`

That means the APK and website show the same live interface and use the same Firebase accounts/data.

### Build APK on GitHub — easiest
Push this project to the `main` branch. Open **GitHub → Actions → Build EqualLearn APK → Run workflow**. When complete, download the `EqualLearn` artifact; it contains `EqualLearn.apk`.

### Build locally
Install Node.js, Android Studio / Android SDK and Java 21, then run:

```bash
npm install
npm run mobile:add-android
npx @capacitor/assets generate --android --assetPath resources
npm run mobile:open
```

## Temporary logo
The generated temporary EqualLearn logo is in `assets/icons/logo.png` and `resources/icon.png`.
