# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Automates check-in/check-out on the Shift Manager app (`pf-schedule-dashboard.vercel.app`) by talking to its Supabase backend's REST API directly. Three implementations of the same logic, all hitting the same Supabase project and meant to stay behaviorally in sync:

- **`cf-worker/`** — the **live deployment**: a Cloudflare Worker (`shift-auto`) serving a PIN-gated mobile UI, a small JSON API, and a scheduled reconciler that auto check-in/out Mon–Fri (driven by an external `/cron` pinger since Cloudflare cron proved unreliable — see Worker section). This is what actually runs unattended. See `STATUS.md` for live operational state (URLs, KV ids, schedule, known issues).
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

Same logic as `auto-shift.js`, restructured for Workers. Entry points in `src/index.js`: `fetch` (UI at `/`; JSON API under `/api/*` gated by the `UI_PIN` secret; **`/cron` external trigger** gated by the `CRON_KEY` secret → `runAuto`) and `scheduled` (Cloudflare cron → `runAuto`). `src/shift.js` is the Supabase client; `src/ui.js` is the single-page UI string.

- **Auth & session:** same refresh-first / password-fallback as the CLI, but the rotating refresh token lives in **KV** (`SHIFT_KV`, key `session`) instead of a file. `createClient()` keeps the **full auth session in a closure variable `session`** (not just the token) because the Slack cookie needs it. ⚠️ Don't shadow that variable — `tryRefresh()` uses a *separate* local `stored` for the KV blob precisely so `session = data` reaches the closure (a shadow bug here silently disabled Slack while DB writes kept working).
- **Cron reconciliation (`runAuto`):** idempotent and self-correcting — check in when `now ∈ [start−CHECKIN_LEAD_MIN, end)` and not yet checked in; check out when `now ≥ end+CHECKOUT_LAG_MIN` and a check-in is open. Times are derived in ICT (`ictParts`). It returns a `{date, now, actions[], covers[]}` summary (surfaced over `/cron`, since Cloudflare logs aren't queryable via API on this account). `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` define the **exact action instants**; the trigger just has to fire often enough to land inside each window.
- **Cover auto-checkout (`runAuto` cover sweep):** a shift the user *covers* for someone else belongs to a different member, so it never appears in `getTodayAssignments` (which filters `member_id=eq.MEMBER_ID`). But the check-in row carries *our* `member_id`, so after the own-assignment loop, `runAuto` scans `getOpenCheckins()` (open check-ins under our member, with the assignment embedded) and checks out any whose assignment owner ≠ us (via `checkoutById()`). It **never auto checks-IN covers** (a cover can't be detected before its check-in exists) and **never fires Slack for them** (Slack would post under the shift owner's name). Covers are reported in the `covers[]` summary. Verified live 04/06: a 5-8 cover auto-checked-out at 08:05 ICT off the external cron. **Works at any hour / any date:** `getOpenCheckins()` returns open check-ins for **today *and* yesterday**, and the due time is computed on the FULL end **datetime** (`shift_date` + slot end, +1 day when the slot wraps midnight, i.e. `end ≤ start` like `23-2`). So early-morning (`2-5` ends 05:00) and overnight (`23-2` ends 02:00 next day) covers are handled too — **provided the trigger runs ~24/7** (see Triggering); on a daytime-only trigger the checkout still happens, just at the next fire (late). The full cover *handshake* (making a cover the app actually displays) spans **three** tables — `leaves` + `ot_requests` + `checkins` — see "Leave / cover / OT data model" below; a raw check-in alone is an "orphan" the app won't show.
- **Triggering is dual + redundant, now ~24/7.** Cloudflare free-tier cron proved unreliable (29/05: it fired *zero* times all day — verified by a ~40-min live `wrangler tail`). So the **primary** trigger is an **external scheduler (cron-job.org) GETting `/cron?key=<CRON_KEY>` every ~5 min**; the Cloudflare cron (`*/5 * * * *` — every 5 min, **all hours, all days**) is best-effort backup. The schedule is 24/7 (not just daytime Mon–Fri) so the cover sweep can close shifts ending at *any* hour; own day-shift check-in/out still only acts in its window because `runAuto` is window-gated by `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` and idempotent. **For out-of-window covers to check out *on time*, the cron-job.org job must also be set to ~24/7** — Cloudflare cron alone is too unreliable.
- **Config in KV** (`config`): `{ autoEnabled, skipDates, slackNotify }`, all default-on; surfaced/toggled via `/api/config` and the UI switches.
- **Vars vs secrets:** public-safe values (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MEMBER_ID`) are in `wrangler.toml`; `EMAIL`, `PASSWORD`, `UI_PIN`, `CRON_KEY` are Worker secrets. Deploy with `npx wrangler deploy` from `cf-worker/`.

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
| `/rest/v1/leaves` | GET/PATCH | Leave + cover records — see data model below. |
| `/rest/v1/ot_requests` | GET/POST | Overtime/cover requests — the "OT request" tab reads this. See data model below. |

Failures are surfaced via `die()` (prints, exits 1). A 400 on refresh means the token chain is dead; a 403 on write usually means RLS rejected it (shift covered, or `MEMBER_ID` ≠ JWT `sub`). DELETE on `checkins` silently affects 0 rows (no delete policy).

## Leave / cover / OT data model (Shift Manager schema, reverse-engineered 04/06)

Tables visible to a normal `authenticated` member via REST (RLS-scoped; no `service_role`):

| Table | Rows~ | Columns |
|---|---|---|
| `members` | 28 | `id, email, name, is_admin, created_at` |
| `shift_assignments` | 5049 | `id, member_id, shift_date, shift_slot, created_at, is_sl, status, role` |
| `checkins` | 368 | `id, assignment_id, member_id, checkin_time, checkin_text, checkout_time, checkout_text, created_at` — **no `role` column**; **no DELETE RLS policy** (DELETE returns 0 rows; only INSERT/UPDATE work) |
| `leaves` | 51 | `id, member_id, assignment_id, reason, screenshot_url, status, covered_by, covered_at, created_at, approved_by, approved_at, rejected_by, rejected_at, rejection_reason` |
| `ot_requests` | 36 | `id, member_id, leave_id, assignment_id, status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at` |

**Shift slots** tile the whole 24h day in 3-hour blocks: `2-5, 5-8, 8-11, 11-14, 14-17, 17-20, 20-23, 23-2` (literal ICT hours; `23-2` wraps midnight — `parseSlot` returns `end<start` for it, which the worker's window math doesn't handle, but such shifts fall outside the 07:00–19:00 trigger window anyway).

**Cover handshake — taking a teammate's leave-shift requires writing THREE rows** (the web app does all three when you "nhận ca"; doing fewer leaves it invisible):
1. **`leaves`** PATCH: set `covered_by=<you>`, `status='covered'`, `covered_at`. (The person off is `member_id`; their leave starts `approved` once self/admin-approved.)
2. **`ot_requests`** POST: `{ member_id:<you>, leave_id:<the leave>, assignment_id, status:'approved', approved_by:<you>, approved_at }` — **this is what the "OT request" tab on `/dashboard/leave` lists.** Covers auto-approve (the live 5-8 row had `approved_by` = the coverer, ~2s after create). Non-cover OT (working an extra shift) also lands here with `leave_id=null`.
3. **`checkins`** POST under your own `member_id` (then checkout). The cover auto-checkout sweep above closes it.

RLS permits an authenticated member to set `covered_by`/insert their own `ot_requests`/insert checkins (member_id must = JWT `sub`). It does **not** let you UPDATE someone else's `shift_assignments` (e.g. reassign a shift's owner → PATCH returns 200 but 0 rows) or DELETE a `checkins` row. `/dashboard/leave` is server-rendered (RSC) — its data isn't in the page HTML or client JS bundle; the page lists the viewer's *own* leaves plus an OT-request tab.

## Slack server action contract

On the Vercel app (`https://pf-schedule-dashboard.vercel.app`), not Supabase:

| Endpoint | Method | Purpose |
|---|---|---|
| `/dashboard/my-schedule` | GET (auth cookie) | Authenticated page; its JS bundle carries the `Next-Action` id for `sendSlackCheckInNotification` |
| `/dashboard/my-schedule` | POST + `Next-Action: <id>` | Invoke the server action → posts the Slack message. Body is `[name, role, slot, action]`; 200 + `…:true` on success |

## Security

Secrets live in **`.env`** (CLI: password + live refresh token), **`cf-worker/.dev.vars`** (local Worker dev), and **Cloudflare Worker secrets** (prod). None are committed — `.env`, `.shift-state.json`, `.dev.vars`, `.wrangler/` are all `.gitignore`d. The repo is **public**, so before committing keep secrets out of tracked files (e.g. `STATUS.md` had the password/PIN inlined once — they're now redacted to placeholders). The anon key + `MEMBER_ID` in `wrangler.toml`/`env.example` are safe to expose. If any real token lands in a tracked file or in git history, rotate it.
