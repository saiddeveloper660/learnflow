# LearnFlow

LearnFlow is an Android daily-learning routine tracker built with Kotlin and Jetpack Compose.

## Features

- Track topics to learn, completed learning, and future learning goals
- Voice reminders and scheduled notifications
- Categorized notes
- PIN / biometric app lock
- Local data storage with Room and DataStore
- Optional Google Sign-In and Firebase Firestore cloud sync

## Requirements

- Android Studio (recent stable version)
- JDK version supported by the Android Gradle Plugin
- Android SDK required by this project (compile SDK 36)

## Open the project

1. Download or clone this repository.
2. Open the project folder in Android Studio.
3. Allow Gradle to sync and install any requested Android SDK components.
4. Run the app on an emulator or Android device.

## Configure Firebase (for Google Sign-In and cloud sync)

The Firebase project configuration from the original AI Studio export has intentionally **not** been included in this repository.

1. Create or select a Firebase project.
2. Add an Android app using this package name: `com.example.learnflow`.
3. Enable the Firebase Authentication provider(s) used by the app, including Google Sign-In.
4. Create/enable Cloud Firestore.
5. Download that Firebase project's `google-services.json` and place it in the `app/` directory.
6. Review and deploy the included `firestore.rules` to your Firebase project's Firestore database.
7. In `app/src/main/res/values/firebase_applet_config.xml`, set `firestore_database_id` to your Firestore database ID (use `(default)` if you use the default database).
8. For Google Sign-In, configure the correct SHA-1/SHA-256 signing certificate fingerprints in Firebase and the matching OAuth configuration.

`google-services.json` is ignored by Git in this repository to avoid publishing project-specific configuration. Each developer should obtain the correct file from the Firebase project.

## Firestore rules tests

The repository includes `firestore.test.js` and `firestore.rules`. To run the rules tests, install Node.js dependencies for the Firebase Emulator rules testing package and start the Firestore emulator on `127.0.0.1:8085` before running the test file.

## Security notes

- Never commit `.env`, service-account JSON files, private keys, upload keystores, or passwords.
- The Firebase client configuration is project-specific. The original exported `google-services.json` was removed; use your own Firebase project's file.
- Firebase client API keys are identifiers used by client apps, not substitutes for server-side secrets. Restrict API keys where appropriate and rely on Firebase Security Rules and App Check for access protection.
- Do not put private server credentials in Android app source code.

## License

No license has been added. Add a license file if you want to specify how others may use, modify, or distribute this project.
