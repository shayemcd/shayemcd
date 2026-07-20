# 🏋️ FitTrack

A private, two-person workout & body-weight tracker for Shaye and Akim.
No native app, no build step — a static PWA on GitHub Pages, synced through
Firebase.

**Live app:** https://shayemcd.github.io/fitness-tracker/ · **First time? → [SETUP.md](SETUP.md)** · **Demo:** append `?demo=1`

## What it does

- **Log workouts fast** — add an exercise (autocomplete over ~100 exercises +
  cardio activities, custom exercises supported) and set reps/weight once for
  all sets; expand for per-set control. Cardio logs minutes. Every exercise
  shows an estimated calorie burn.
- **Smart day detection** — it figures out from what you logged whether it was
  a *Back + Biceps* day, *Quad Day*, *Push Day*, etc., based on per-muscle set
  volume. Overridable if it guesses wrong.
- **Smart split planning** — best-practice split templates (5-day muscle
  pairings like chest+triceps / back+biceps / quads+calves / hams+glutes,
  Push-Pull-Legs, Upper/Lower), a *"train this today"* suggestion based on
  muscle recovery (≥48 h rule), and a generated **7-day plan**: each session
  is a 5–10 min cardio warm-up, abs, 4 weighted/machine exercises for the
  day's pairing, and a warm-down — one tap adds it to your log.
- **Partner sync** — you both see each other's workouts live (History tab).
  One tap copies your partner's routine into your own log with *your*
  last-used weights pre-filled, so you just tweak and lift.
- **AI meal tracking** — photograph or describe a meal and Gemini (via
  Firebase AI Logic) estimates calories, protein, carbs, fat, and fiber.
  Batch-cooked meals are shared with per-person portions (you had ¼, they had
  ½) and saved to a reusable **meal bank**.
- **Macro targets & gap flags** — daily calorie/macro dashboard against
  recommended targets (from your weight and goal, overridable), with flags
  like "protein behind pace" or "no veg yet" while there's still time to fix it.
- **Watch data** — Fitbit auto-sync (sleep, calories burned, steps) via the
  Fitbit Web API; quick manual daily entry for the Apple Watch wearer.
- **PRs & progress** — automatic personal-record toasts, "last time: 3×8 @
  80 kg" hints while logging, and per-exercise progression charts.
- **Rest timer & weekly recap** — a floating 60/90/120 s rest countdown, and a
  7-day summary (workouts vs plan, sets per muscle, kcal in/out, sleep,
  weight change).
- **Body-weight tracking** — daily entries, shared trend chart with 7-day
  moving averages for both of you.
- **Per-user units** — one of you lifts in kg, the other in lbs; everything is
  converted when viewing the other person's numbers.
- **Installable & offline** — "Add to Home Screen" makes it feel like a native
  app; Firestore's offline cache keeps it working with no signal in the gym.

## Privacy

Sign-in is Google-only and the Firestore security rules
([`firestore.rules`](firestore.rules)) allowlist exactly two email addresses.
Anyone else who finds the URL can load the shell but can't read or write any
data.

## Stack

Vanilla JS ES modules, Chart.js (vendored), Firebase Auth + Firestore
(free tier), GitHub Pages. No bundler, no framework, no server to maintain.

## Development

```bash
# unit tests (split logic, plan generator, energy, nutrition, PRs, recap)
node --test test/split.test.mjs test/v2.test.mjs

# browser end-to-end test (Playwright, drives the demo mode)
node test/e2e.mjs

# run locally
python3 -m http.server  # then open http://localhost:8000/?demo=1
```
