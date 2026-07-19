// ============================================================
// PASTE YOUR FIREBASE CONFIG HERE — see SETUP.md, step 4.
// Get it from: Firebase console → Project settings → Your apps
// → Web app → "SDK setup and configuration" → Config.
// These values are safe to commit publicly; access control is
// enforced by the Firestore security rules, not by these keys.
// ============================================================
export const firebaseConfig = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME",
  projectId: "PASTE_ME",
  storageBucket: "PASTE_ME",
  messagingSenderId: "PASTE_ME",
  appId: "PASTE_ME",
};

export function configReady() {
  return firebaseConfig.apiKey !== "PASTE_ME";
}
