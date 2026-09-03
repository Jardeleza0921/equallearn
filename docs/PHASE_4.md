# Phase 4 — Appwrite Storage

EqualLearn keeps Firebase Authentication and Cloud Firestore as the identity/data backend. Appwrite is used only for binary file storage.

## Appwrite configuration

- Endpoint: `https://sgp.cloud.appwrite.io/v1`
- Project ID: `6a99736e001b37a046a9`
- Bucket ID: `6a997618001818031481`
- Android package: `com.equallearn.app`

No API key is embedded in either client.

## Bucket expectations

- Bucket Create: `Role.users()`
- Bucket Read: `Role.users()`
- File Security: enabled
- Update/Delete bucket permissions: disabled
- Max file size: 20 MB
- Uploaded files created by EqualLearn receive public read permission so profile images and lesson resources can open from both browsers and the mobile app. The creator Appwrite session receives file-level update/delete permission.

Because EqualLearn authenticates with Firebase, the client creates a lightweight Appwrite anonymous session only when an upload is requested. Firebase remains the source of truth for EqualLearn roles.

## Web

- `appwrite` Web SDK
- Profile pictures upload to Appwrite and save `profileImage` metadata to `users/{uid}` in Firestore.
- Teacher module/lesson editors accept actual files or an external URL.
- Appwrite file metadata is stored on the module/lesson Firestore record.

## Mobile

- `react-native-appwrite`
- `react-native-url-polyfill`
- `expo-document-picker`
- Profile pictures use Appwrite.
- Teacher module/lesson attachments use the native Android document picker and Appwrite.
- Student file/resource buttons continue using the Firestore URL, so Appwrite attachments work without a separate student storage screen.

## Firestore metadata

New optional fields can include:

- `fileId`
- `fileName`
- `fileType`
- `fileSize`
- `filePath` (`appwrite:<id>`)
- `fileURL` on modules / `fileUrl` on lessons
- `profileImageFileId`, `profileImageName`, `profileImageType`, and `profileImage` on users

No existing collections are renamed or removed.

## Security note

Anonymous Appwrite sessions are a pragmatic bridge while Firebase remains the primary identity system. For a stricter production authorization boundary, a later server function can verify a Firebase ID token before performing Appwrite uploads. Do not put an Appwrite server API key in React or Expo.
