# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Automates check-in/check-out on the Shift Manager app (`pf-schedule-dashboard.vercel.app`) by talking to its Supabase backend's REST API directly. Three implementations of the same logic, all hitting the same Supabase project and meant to stay behaviorally in sync:

- **`cf-worker/`** — the **live deployment**: a Cloudflare Worker (`shift-auto`) serving a PIN-gated mobile UI, a small JSON API, and cron triggers that auto check-in/out Mon–Fri. This is what actually runs unattended. See `STATUS.md` for live operational state (URLs, KV ids, cron schedule, known issues).
- **`auto-shift.js`** — the original single-file Node.js CLI, kept as a local **backup**.
- **`n8n-workflow.json`** — a parallel reimplementation as an importable n8n workflow (cron-triggered).

Beyond recording attendance, both the live worker and the real web app also fire a **Slack notification** on each check-in/out (see "Slack notification" below) — the worker replicates the web app's behaviour so bot actions look identical to manual ones.

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
- **`role` derivation:** uses `assignment.role`, falling back to `"SL"` if `is_sl` else `"FL/TS"`. The `checkins` table has **no `role` column** — `role` is only used in the Slack notification, never in the check-in POST body (sending it returns `400 PGRST204`).
- **`todayISODate()`** intentionally formats in the machine's local timezone, matching how `shift_date` is stored. Don't switch it to naive UTC.

## Cloudflare Worker (`cf-worker/`) — the live deployment

Same logic as `auto-shift.js`, restructured for Workers. Three entry points in `src/index.js`: `fetch` (UI at `/`, JSON API under `/api/*` gated by the `UI_PIN` secret) and `scheduled` (cron → `runAuto`). `src/shift.js` is the Supabase client; `src/ui.js` is the single-page UI string.

- **Auth & session:** same refresh-first / password-fallback as the CLI, but the rotating refresh token lives in **KV** (`SHIFT_KV`, key `session`) instead of a file. `createClient()` keeps the **full auth session in a closure variable `session`** (not just the token) because the Slack cookie needs it. ⚠️ Don't shadow that variable — `tryRefresh()` uses a *separate* local `stored` for the KV blob precisely so `session = data` reaches the closure (a shadow bug here silently disabled Slack while DB writes kept working).
- **Cron reconciliation (`runAuto`):** idempotent and self-correcting — check in when `now ∈ [start−CHECKIN_LEAD_MIN, end)` and not yet checked in; check out when `now ≥ end+CHECKOUT_LAG_MIN` and a check-in is open. Times are derived in ICT (`ictParts`). `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` **must stay in sync** with the cron times in `wrangler.toml`.
- **Config in KV** (`config`): `{ autoEnabled, skipDates, slackNotify }`, all default-on; surfaced/toggled via `/api/config` and the UI switches.
- **Vars vs secrets:** public-safe values (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MEMBER_ID`) are in `wrangler.toml`; `EMAIL`, `PASSWORD`, `UI_PIN` are Worker secrets. Deploy with `npx wrangler deploy` from `cf-worker/`.

## Slack notification

The real web app, after writing to `checkins`, calls a **Next.js Server Action** `sendSlackCheckInNotification(name, role, "H:00 - H:00", "checkin"|"checkout")` that posts to Slack. Direct REST writes (this bot) don't trigger it, so the worker replicates the call in `notifySlack()` (`cf-worker/src/shift.js`), fired after every successful check-in/out (cron + manual). Invariants:

- **Auth via cookie:** builds the `@supabase/ssr` cookie `sb-<ref>-auth-token = "base64-"+b64utf8(JSON.stringify(session))` (chunked into `.0/.1` past ~3180 chars) from the closure `session`, then POSTs `/dashboard/my-schedule` with header `Next-Action: <id>`, `Content-Type: text/plain;charset=UTF-8`, body `[name, role, slot, action]`. Success = a flight response ending in `<row>:true`.
- **Self-healing action id:** the `Next-Action` id is **build-specific** (changes when the upstream app redeploys). `discoverActionId()` scrapes it from the public bundle and caches it in KV (`slack_action_id`); on a failed POST it re-scrapes once. The scrape (page + ~18 JS chunks) is heavy, so the id is normally served from cache — keep it pre-seeded.
- **Non-fatal:** `notifySlack()` never throws; a Slack failure only logs and must never affect attendance recording. Gated by `config.slackNotify`.
- **Name comes from `shift_assignments` embed** `members!member_id(name)`; `role` from `assignment.role`; `slot` is `shift_slot.replace("-", ":00 - ") + ":00"` (so `"8-11"` → `"8:00 - 11:00"`), matching the web app exactly.

## Supabase REST contract

Base: `https://qktvfncduxmoijzfqbdb.supabase.co`. All calls send the anon `apikey` header plus `Authorization: Bearer <access_token>`; writes add `Prefer: return=representation`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/v1/token?grant_type=password` | POST | Email+password login → fresh session (fallback / bootstrap) |
| `/auth/v1/token?grant_type=refresh_token` | POST | Exchange refresh token for access token (rotates refresh token) |
| `/rest/v1/shift_assignments` | GET | Today's assignment(s) for `member_id`; the worker also embeds `members!member_id(name)` for the Slack notification |
| `/rest/v1/checkins` | GET | Find open / latest check-in for an assignment |
| `/rest/v1/checkins` | POST | Create check-in |
| `/rest/v1/checkins?id=eq.X` | PATCH | Set checkout time |

Failures are surfaced via `die()` (prints, exits 1). A 400 on refresh means the token chain is dead; a 403 on write usually means RLS rejected it (shift covered, or `MEMBER_ID` ≠ JWT `sub`).

## Slack server action contract

On the Vercel app (`https://pf-schedule-dashboard.vercel.app`), not Supabase:

| Endpoint | Method | Purpose |
|---|---|---|
| `/dashboard/my-schedule` | GET (auth cookie) | Authenticated page; its JS bundle carries the `Next-Action` id for `sendSlackCheckInNotification` |
| `/dashboard/my-schedule` | POST + `Next-Action: <id>` | Invoke the server action → posts the Slack message. Body is `[name, role, slot, action]`; 200 + `…:true` on success |

## Security

Secrets live in **`.env`** (CLI: password + live refresh token), **`cf-worker/.dev.vars`** (local Worker dev), and **Cloudflare Worker secrets** (prod). None are committed — `.env`, `.shift-state.json`, `.dev.vars`, `.wrangler/` are all `.gitignore`d. The repo is **public**, so before committing keep secrets out of tracked files (e.g. `STATUS.md` had the password/PIN inlined once — they're now redacted to placeholders). The anon key + `MEMBER_ID` in `wrangler.toml`/`env.example` are safe to expose. If any real token lands in a tracked file or in git history, rotate it.
