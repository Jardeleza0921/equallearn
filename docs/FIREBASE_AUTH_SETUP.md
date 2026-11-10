# EqualLearn — Firebase auth setup (Google sign-in, password reset, rules)

The web app now supports **Sign in with Google**, **forgot-password e-mails**, and an
in-app password reset screen. Three console settings are still required, because they
can only be changed in the Firebase project (`equallearn-test`).

## 1. Enable Google as a sign-in provider

Firebase Console → **Authentication** → **Sign-in method** → **Add new provider** → **Google**

- Turn it on.
- Choose a support e-mail (the account shown to students on the Google consent screen).
- Save.

Without this step the app shows: *“Google sign-in is not enabled for this Firebase project yet.”*

## 2. Authorize the domains students use

Firebase Console → **Authentication** → **Settings** → **Authorized domains**

Make sure these are listed:

- `equallearn-test.firebaseapp.com` (already there)
- `equallearn.netlify.app` (the deployed site)
- `localhost` (already there, for local testing)

Google sign-in and the password-reset *continue* link only work on authorized domains.

## 3. Deploy the Firestore rules

`firestore.rules`, `firebase.json`, and `.firebaserc` are in the repository root.
From a terminal with access to the project:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` into
Firebase Console → **Firestore Database** → **Rules** → **Publish**.

What the rules allow:

| Collection | Read | Write |
| --- | --- | --- |
| `users` | own profile; all profiles for teacher/admin | self-create as an active *student*; own profile edits (role/status/e-mail locked); admins manage everyone |
| `modules`, `lessons`, `questions` | any signed-in account | teacher/admin |
| `progress` | own rows; all rows for staff | own rows; staff |
| `classGroups` | any signed-in account | any signed-in account (registration adds the section); admins delete |
| `teacherAssignments` | any signed-in account | admin |
| `notifications` | own; staff | staff create; own read flag |
| anything else | denied | denied |

The rules rely on `users/{uid}.role`. Existing accounts already have that field.

## 4. Password reset e-mails

The app calls `sendPasswordResetEmail` with a continue link back to
`/login?reset=done`, so after Firebase's reset page the student lands back on
EqualLearn's sign-in screen with a confirmation message. The e-mail itself is sent by
Firebase.

Optional: to keep the whole reset inside EqualLearn, open
Firebase Console → **Authentication** → **Templates** → **Password reset** →
edit the action link and set:

```
https://equallearn.netlify.app/reset-password
```

The app then shows its own **Reset password** screen (`/reset-password?oobCode=…`),
verifies the code, and lets the student choose a new password.

## Local testing

```bash
npm ci
npm --workspace web run dev
```

Google sign-in and reset links do not work from `file://`; use the dev server on
`localhost` (an authorized domain).
