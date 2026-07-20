// Firestore-backed store. Loaded only when config.js has real values.
// All stores (this one and the demo store) expose the same interface:
//   init, onAuth, signIn, signOut, saveProfile, subscribeProfiles,
//   subscribeWorkouts, saveWorkout, deleteWorkout,
//   subscribeWeights, saveWeight, deleteWeight

import { firebaseConfig } from '../config.js';

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0';

let app, auth, db, fs; // fs = firestore module namespace

export function firebaseApp() { return app; }
export { SDK };

export const firebaseStore = {
  kind: 'firebase',

  async init() {
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    fs = fsMod;
    this._auth = authMod;
    app = initializeApp(firebaseConfig);
    auth = authMod.getAuth(app);
    // Offline cache so the app works in the gym with bad signal.
    db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    // Complete a redirect-based sign-in if one is in flight.
    try { await authMod.getRedirectResult(auth); } catch { /* surfaced via onAuth */ }
  },

  onAuth(cb) {
    this._auth.onAuthStateChanged(auth, u => {
      cb(u ? { uid: u.uid, name: u.displayName || u.email, email: u.email } : null);
    });
  },

  async signIn() {
    const provider = new this._auth.GoogleAuthProvider();
    try {
      await this._auth.signInWithPopup(auth, provider);
    } catch (e) {
      // Popup blockers / iOS quirks: fall back to a full-page redirect.
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user'
          || e.code === 'auth/operation-not-supported-in-this-environment') {
        await this._auth.signInWithRedirect(auth, provider);
      } else {
        throw e;
      }
    }
  },

  async signOut() {
    await this._auth.signOut(auth);
  },

  async saveProfile(profile) {
    await fs.setDoc(fs.doc(db, 'users', profile.uid), profile, { merge: true });
  },

  subscribeProfiles(cb, onError) {
    return fs.onSnapshot(fs.collection(db, 'users'),
      snap => cb(snap.docs.map(d => d.data())),
      onError);
  },

  subscribeWorkouts(cb, onError) {
    const q = fs.query(fs.collection(db, 'workouts'), fs.orderBy('date', 'desc'), fs.limit(400));
    return fs.onSnapshot(q,
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError);
  },

  async saveWorkout(w) {
    await fs.setDoc(fs.doc(db, 'workouts', w.id), w);
  },

  async deleteWorkout(id) {
    await fs.deleteDoc(fs.doc(db, 'workouts', id));
  },

  subscribeWeights(cb, onError) {
    const q = fs.query(fs.collection(db, 'bodyweight'), fs.orderBy('date', 'desc'), fs.limit(800));
    return fs.onSnapshot(q,
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError);
  },

  async saveWeight(entry) {
    await fs.setDoc(fs.doc(db, 'bodyweight', entry.id), entry);
  },

  async deleteWeight(id) {
    await fs.deleteDoc(fs.doc(db, 'bodyweight', id));
  },

  subscribeMeals(cb, onError) {
    const q = fs.query(fs.collection(db, 'meals'), fs.orderBy('date', 'desc'), fs.limit(400));
    return fs.onSnapshot(q,
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError);
  },

  async saveMeal(meal) {
    await fs.setDoc(fs.doc(db, 'meals', meal.id), meal);
  },

  async deleteMeal(id) {
    await fs.deleteDoc(fs.doc(db, 'meals', id));
  },

  subscribeMealBank(cb, onError) {
    return fs.onSnapshot(fs.collection(db, 'mealBank'),
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError);
  },

  async saveBankMeal(entry) {
    await fs.setDoc(fs.doc(db, 'mealBank', entry.id), entry, { merge: true });
  },

  async deleteBankMeal(id) {
    await fs.deleteDoc(fs.doc(db, 'mealBank', id));
  },

  subscribeWatch(cb, onError) {
    const q = fs.query(fs.collection(db, 'watch'), fs.orderBy('date', 'desc'), fs.limit(200));
    return fs.onSnapshot(q,
      snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError);
  },

  async saveWatch(entry) {
    await fs.setDoc(fs.doc(db, 'watch', entry.id), entry, { merge: true });
  },
};
