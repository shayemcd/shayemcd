# 🏋️ FitTrack

A private, two-person workout & body-weight tracker for Shaye and Akim.
No native app, no build step — a static PWA on GitHub Pages, synced through
Firebase.

**Live app:** https://shayemcd.github.io/fitness-tracker/ · **First time? → [SETUP.md](SETUP.md)** · **Demo:** append `?demo=1`

## What it does

- **Log workouts daily** — exercise, sets, reps, weight, with autocomplete over
  a built-in database of ~100 exercises mapped to muscle groups (custom
  exercises supported).
- **Smart day detection** — it figures out from what you logged whether it was
  a *Back + Biceps* day, *Quad Day*, *Push Day*, etc., based on per-muscle set
  volume. Overridable if it guesses wrong.
- **Smart split planning** — best-practice split templates (5-day muscle
  pairings like chest+triceps / back+biceps / quads+calves / hams+glutes,
  Push-Pull-Legs, Upper/Lower) and a *"train this today"* suggestion based on
  which muscle groups are recovered (≥48 h rule) and least recently trained.
- **Partner sync** — you both see each other's workouts live. One tap copies
  your partner's routine into your own log with *your* last-used weights
  pre-filled, so you just tweak and lift.
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
# unit tests for the split/day-detection logic
node --test test/split.test.mjs

# browser end-to-end test (Playwright, drives the demo mode)
node test/e2e.mjs

# run locally
python3 -m http.server  # then open http://localhost:8000/?demo=1
```
