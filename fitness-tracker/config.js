// ============================================================
// PASTE YOUR FIREBASE CONFIG HERE — see SETUP.md, step 4.
// Get it from: Firebase console → Project settings → Your apps
// → Web app → "SDK setup and configuration" → Config.
// These values are safe to commit publicly; access control is
// enforced by the Firestore security rules, not by these keys.
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyDeRcrD7tMefZK_2vKay61VIuFV0mrYDTo",
  authDomain: "fittrack-954c3.firebaseapp.com",
  projectId: "fittrack-954c3",
  storageBucket: "fittrack-954c3.firebasestorage.app",
  messagingSenderId: "359303332323",
  appId: "1:359303332323:web:bf1e47ce7a00ecd4ade0d6",
};

export function configReady() {
  return firebaseConfig.apiKey !== "PASTE_ME";
}
