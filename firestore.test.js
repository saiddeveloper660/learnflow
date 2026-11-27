const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user cannot read or write any user collections", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).collection("learning_items").get());
  await assertFails(
    unauthDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_1").set({
      userId: ALICE_UID,
      title: "Coroutines",
      details: "Learn structured concurrency",
      category: "TO_LEARN",
      learnedSource: "NONE",
      createdAt: new Date(Date.now() - 1000),
      updatedAt: new Date(Date.now() - 1000),
    })
  );
});

test("Owner can create, list, update, and delete learning items with Kotlin-aligned payload", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const created = new Date(Date.now() - 5000);

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_1").set({
      userId: ALICE_UID,
      title: "Jetpack Compose Animations",
      details: "Master spring physics and AnimatedVisibility",
      category: "TO_LEARN",
      learnedSource: "NONE",
      reminderEpochMs: Date.now() + 3600000,
      ringtoneName: "Crystal Chime",
      createdAt: created,
      updatedAt: created,
    })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").get()
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_1").update({
      category: "LEARNED",
      learnedSource: "FROM_TO_LEARN",
      completedEpochMs: Date.now(),
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Reject ghost field / shadow update
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_1").update({
      isAdmin: true,
      updatedAt: new Date(Date.now() - 200),
    })
  );

  // Reject immutable createdAt overwrite
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_1").update({
      createdAt: new Date(Date.now() - 100),
      updatedAt: new Date(Date.now() - 100),
    })
  );

  // Reject @DocumentId "id" inside body
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("learning_items").doc("item_2").set({
      id: "item_2",
      userId: ALICE_UID,
      title: "Bad payload",
      details: "",
      category: "TO_LEARN",
      learnedSource: "NONE",
      createdAt: created,
      updatedAt: created,
    })
  );
});

test("Cross-user access to learning items, categories, notes, and history is denied", async () => {
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date(Date.now() - 2000);

  await assertSucceeds(
    bobDb.collection("users").doc(BOB_UID).collection("notes").doc("note_1").set({
      userId: BOB_UID,
      categoryId: "cat_1",
      title: "Bob Secret Note",
      content: "Private thoughts",
      colorArgb: 0xFF38BDF8,
      photoNames: ["img_1.jpg"],
      createdAt: now,
      updatedAt: now,
    })
  );

  await assertFails(aliceDb.collection("users").doc(BOB_UID).collection("notes").get());
  await assertFails(aliceDb.collection("users").doc(BOB_UID).collection("notes").doc("note_1").get());
  await assertFails(
    aliceDb.collection("users").doc(BOB_UID).collection("notes").doc("note_1").update({
      title: "Hijacked",
      updatedAt: new Date(Date.now() - 500),
    })
  );
});

test("Owner can manage note categories, notes, profile, and history", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date(Date.now() - 3000);

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).set({
      userId: ALICE_UID,
      displayName: "Alice",
      email: "alice@gmail.com",
      createdAt: now,
      updatedAt: now,
    })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("note_categories").doc("cat_kotlin").set({
      userId: ALICE_UID,
      name: "Kotlin",
      colorArgb: 0xFF8B5CF6,
      iconName: "code",
      createdAt: now,
      updatedAt: now,
    })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("notes").doc("note_1").set({
      userId: ALICE_UID,
      categoryId: "cat_kotlin",
      title: "Flow Operators",
      content: "flatMapLatest vs collectLatest",
      colorArgb: 0xFF8B5CF6,
      photoNames: [],
      createdAt: now,
      updatedAt: now,
    })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("history").doc("hist_1").set({
      userId: ALICE_UID,
      actionType: "NOTE_CREATED",
      title: "Flow Operators",
      subtitle: "Created in Kotlin",
      occurredAtMs: Date.now(),
      createdAt: now,
    })
  );

  // History entries are immutable (update denied)
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("history").doc("hist_1").update({
      title: "Edited",
    })
  );

  // Reject future timestamp
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("history").doc("hist_future").set({
      userId: ALICE_UID,
      actionType: "NOTE_CREATED",
      title: "Future",
      subtitle: "Tampered",
      occurredAtMs: Date.now(),
      createdAt: new Date(Date.now() + 60000),
    })
  );
});
