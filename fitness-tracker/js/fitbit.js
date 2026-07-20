// Fitbit Web API integration (OAuth 2.0 PKCE, public client — no secret).
// One-time setup per SETUP.md: register a free "Personal" app at
// dev.fitbit.com with this app's URL as the redirect URI, and put its
// Client ID in config.js as fitbitClientId.

import { fitbitClientId } from '../config.js';
import { todayStr, addDays } from './utils.js';

const LS_TOKENS = 'fittrack-fitbit-tokens';
const LS_VERIFIER = 'fittrack-fitbit-verifier';
const SCOPES = 'activity sleep';

export function isFitbitConfigured() {
  return !!fitbitClientId && fitbitClientId !== 'OPTIONAL_FITBIT_CLIENT_ID';
}

export function isFitbitConnected() {
  return !!localStorage.getItem(LS_TOKENS);
}

function redirectUri() {
  return location.origin + location.pathname;
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Start the OAuth dance: leaves the page for fitbit.com.
export async function connectFitbit() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(48));
  const verifier = b64url(verifierBytes);
  localStorage.setItem(LS_VERIFIER, verifier);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = b64url(new Uint8Array(digest));
  const url = new URL('https://www.fitbit.com/oauth2/authorize');
  url.search = new URLSearchParams({
    client_id: fitbitClientId,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: SCOPES,
    redirect_uri: redirectUri(),
  });
  location.href = url.toString();
}

export function disconnectFitbit() {
  localStorage.removeItem(LS_TOKENS);
}

async function tokenRequest(params) {
  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: fitbitClientId, ...params }),
  });
  if (!res.ok) throw new Error(`Fitbit token error ${res.status}`);
  const tokens = await res.json();
  localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
  return tokens;
}

// Complete the redirect back from Fitbit (call on app start). Returns true
// if a connection was just completed.
export async function completeFitbitAuth() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const verifier = localStorage.getItem(LS_VERIFIER);
  if (!code || !verifier) return false;
  await tokenRequest({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
  });
  localStorage.removeItem(LS_VERIFIER);
  // Clean the code out of the URL so refreshes don't retry it.
  history.replaceState({}, '', location.pathname);
  return true;
}

async function api(path) {
  let tokens = JSON.parse(localStorage.getItem(LS_TOKENS) || 'null');
  if (!tokens) throw new Error('Fitbit not connected');
  let res = await fetch(`https://api.fitbit.com${path}`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (res.status === 401 && tokens.refresh_token) {
    tokens = await tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
    res = await fetch(`https://api.fitbit.com${path}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
  }
  if (!res.ok) throw new Error(`Fitbit API ${res.status}`);
  return res.json();
}

// Pull yesterday + today and write them into the watch collection.
// Skips days the user already entered manually today (manual wins for edits).
export async function syncFitbit(uid, saveWatch) {
  if (!isFitbitConfigured() || !isFitbitConnected()) return;
  const days = [todayStr(), addDays(todayStr(), -1)];
  for (const date of days) {
    try {
      const [activity, sleep] = await Promise.all([
        api(`/1/user/-/activities/date/${date}.json`),
        api(`/1.2/user/-/sleep/date/${date}.json`),
      ]);
      await saveWatch({
        id: `${uid}_${date}`,
        uid,
        date,
        caloriesOut: activity?.summary?.caloriesOut ?? null,
        steps: activity?.summary?.steps ?? null,
        sleepMinutes: sleep?.summary?.totalMinutesAsleep ?? null,
        source: 'fitbit',
      });
    } catch (e) {
      console.warn('Fitbit sync failed for', date, e);
    }
  }
}
