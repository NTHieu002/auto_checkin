# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file Node.js CLI (`auto-shift.js`) that automates check-in/check-out on the Shift Manager app (`pf-schedule-dashboard.vercel.app`) by calling its Supabase backend's REST API directly. `n8n-workflow.json` is a parallel reimplementation of the same logic as an importable n8n workflow (cron-triggered). Both talk to the same Supabase project and must stay behaviorally in sync.

## Commands

```bash
node auto-shift.js status      # Inspect today's shift + check-in state
node auto-shift.js checkin     # Check in for today's shift (idempotent)
node auto-shift.js checkout    # Check out of today's open check-in
```

Requires Node >= 18 (uses built-in `fetch`). No dependencies, no build step, no tests.

Env vars must be loaded before running. Easiest cross-platform way:
```bash
npm i -g dotenv-cli
dotenv -e .env -- node auto-shift.js status
```

## Architecture & key invariants

The whole flow lives in `auto-shift.js` `main()`: load state → refresh access token → resolve today's assignment → perform the action. A few non-obvious things to preserve when editing:

- **Two auth paths, refresh-first.** `getAccessToken()` tries the stored refresh token (`refreshAccessToken()`), and on any rejection/absence falls back to `passwordLogin()` (`grant_type=password` with `EMAIL`/`PASSWORD`). Password login gives the script its *own* Supabase session, independent of the browser — this is what makes unattended cron runs survive. Both paths funnel through `persistTokens()`.
- **Refresh-token rotation is load-bearing.** Supabase rotates the refresh token on every `grant_type=refresh_token` call, so the new token is persisted to `.shift-state.json` (chmod 600) on *every* successful auth. Never call the refresh endpoint twice in one run. If the chain dies (e.g. a browser session rotated the token out — Supabase reuse detection then revokes it), the password fallback silently recovers; there's no longer a hard requirement to re-scrape a token from the browser.
- **State bootstrapping:** `loadState()` reads `.shift-state.json` if present; else falls back to `INITIAL_REFRESH_TOKEN` (optional now); else returns `{}` and relies entirely on password login.
- **Assignment selection:** when a member has multiple shifts today, the code picks the one with status `scheduled` or `checked_in`, else the earliest. `n8n-workflow.json` mirrors this in its "Build Check-in Body" / "Pick Assignment" code nodes.
- **Idempotency:** `checkin` calls `findOpenCheckin()` first and skips if an open check-in exists (so a double cron fire won't create duplicate rows). `checkout` PATCHes the most recent check-in whose `checkout_time is null`.
- **`role` derivation:** uses `assignment.role`, falling back to `"SL"` if `is_sl` else `"FL/TS"`.
- **`todayISODate()`** intentionally formats in the machine's local timezone, matching how `shift_date` is stored. Don't switch it to naive UTC.

## Supabase REST contract

Base: `https://qktvfncduxmoijzfqbdb.supabase.co`. All calls send the anon `apikey` header plus `Authorization: Bearer <access_token>`; writes add `Prefer: return=representation`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/v1/token?grant_type=password` | POST | Email+password login → fresh session (fallback / bootstrap) |
| `/auth/v1/token?grant_type=refresh_token` | POST | Exchange refresh token for access token (rotates refresh token) |
| `/rest/v1/shift_assignments` | GET | Today's assignment(s) for `member_id` |
| `/rest/v1/checkins` | GET | Find open / latest check-in for an assignment |
| `/rest/v1/checkins` | POST | Create check-in |
| `/rest/v1/checkins?id=eq.X` | PATCH | Set checkout time |

Failures are surfaced via `die()` (prints, exits 1). A 400 on refresh means the token chain is dead; a 403 on write usually means RLS rejected it (shift covered, or `MEMBER_ID` ≠ JWT `sub`).

## Security

`.env` now holds the account **password** plus a live refresh token (= full account access) and must never be committed — it's in `.gitignore`. `.shift-state.json` also holds a live token. The anon key is safe to expose. Note: `README.md` currently has real credentials pasted at the bottom; treat any token there as compromised and rotate it.
