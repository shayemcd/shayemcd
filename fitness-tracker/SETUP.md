# FitTrack setup (one time, ~5 minutes)

The app is static — GitHub Pages serves it, and a free Firebase project handles
sign-in and syncing between your two phones. You need to do the Firebase part
once; after that everything just works.

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with your Google account.
2. **Create a project** → name it anything (e.g. `fittrack`) → you can turn OFF Google Analytics → Create.

## 2. Turn on Google sign-in

1. In the left sidebar: **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → Enable → set the support email → Save.

## 3. Create the database

1. Left sidebar: **Build → Firestore Database → Create database**.
2. Pick a location near you → start in **production mode** → Create.
3. Open the **Rules** tab, delete what's there, and paste the entire contents
   of [`firestore.rules`](firestore.rules) from this repo.
4. **Before publishing**: in the pasted rules, find `allowedEmails()` and make
   sure both Gmail addresses are right — yours is pre-filled
   (`shaye.mcd@gmail.com`), and replace `AKIMS_EMAIL_GOES_HERE@gmail.com` with
   **Akim's actual Google account email**. Then click **Publish**.

   > These emails are the entire access list. Anyone else who signs in sees a
   > "private tracker" screen and can't read or write anything.

## 4. Connect the app to your project

1. Firebase console → click the **gear ⚙ → Project settings**.
2. Under **Your apps**, click the **`</>` (Web)** icon → nickname `fittrack` →
   (no need for Firebase Hosting) → Register app.
3. You'll see a `firebaseConfig = { ... }` block. Copy the six values into
   [`config.js`](config.js) in this repo, replacing the `PASTE_ME` placeholders.
   Easiest way: edit the file right on GitHub (pencil icon) and commit.

   > It's fine that these values are public — they identify the project, they
   > don't grant access. The rules from step 3 are what protect your data.

## 5. Turn on GitHub Pages

1. This repo → **Settings → Pages**.
2. Under **Build and deployment**: Source = **Deploy from a branch**,
   Branch = **main**, folder **/ (root)** → Save.
3. After a minute the app is live at
   **https://shayemcd.github.io/fitness-tracker/**

## 6. Authorize the domain for sign-in

1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain**.
2. Add: `shayemcd.github.io`

## 7. Smoke test (with Akim)

1. Both of you open **https://shayemcd.github.io/fitness-tracker/** on your phones.
2. Both sign in with Google. You should each land on the **Today** tab.
   (If you see "Private tracker", the email in `firestore.rules` doesn't match
   that Google account — fix and re-publish the rules.)
3. On your phone: log an exercise or two — watch the day-type badge appear.
4. On Akim's phone: **Partner** tab → your workout should appear within seconds
   → open it → **Copy to my log** → adjust weights.
5. Both log a body weight on the **Weight** tab — the shared chart shows both
   trend lines, each converted to the viewer's preferred unit (⚙ Settings).
6. On your phone's browser menu, choose **Add to Home Screen** — the app
   installs like a native app and works offline in the gym.

## Want to try it before doing any of this?

Open the app with `?demo=1` (or click "Try the demo first" on the setup
screen). Demo mode runs entirely on your device with a fake partner, so you
can poke around every feature with zero setup.
