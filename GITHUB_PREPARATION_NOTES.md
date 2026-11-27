# GitHub preparation notes

- Removed `metadata.json` and `firebase-blueprint.json` because they are AI Studio export metadata/blueprint files, not required to build the Android app.
- Removed the original `app/google-services.json`, which contained project-specific Firebase identifiers and a client API key. Add your own Firebase configuration before using Google Sign-In or Firestore cloud sync.
- Changed the Firestore database ID resource to `(default)`; update it if your Firebase project uses a named database.
- Kept the app's Kotlin source, Android resources, Gradle files, Firestore rules, and rules test.
- Added a Git ignore list for local secrets, Firebase config, keystores, and build output.
- This is a source cleanup, not a verified successful Android build. Build and test in Android Studio after adding your Firebase configuration.
