// Supabase Shift Manager client for Cloudflare Workers.
// Stateless per request; persists the rotating refresh token in KV.

const DEFAULT_URL = "https://qktvfncduxmoijzfqbdb.supabase.co";
const SESSION_KEY = "session"; // KV key holding { refresh_token, ... }
const SLACK_ACTION_KEY = "slack_action_id"; // cached Next.js server-action id
const DEFAULT_APP_URL = "https://pf-schedule-dashboard.vercel.app";
const SLACK_ACTION_NAME = "sendSlackCheckInNotification";

// UTF-8 safe base64 (Workers btoa is Latin1-only); session JSON may contain unicode.
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// ICT (UTC+7, no DST). Workers run in UTC, so derive Vietnam wall-clock explicitly.
export function ictParts(now = Date.now()) {
  const d = new Date(now + 7 * 3600 * 1000);
  return {
    date: d.toISOString().slice(0, 10), // YYYY-MM-DD in ICT
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    hhmm: d.toISOString().slice(11, 16),
  };
}

// "8-11" / "14-17" / "08:00-11:00" -> { start, end } in whole hours, or null.
export function parseSlot(slot) {
  const m = String(slot).match(/(\d{1,2})(?::\d{2})?\s*-\s*(\d{1,2})/);
  if (!m) return null;
  return { start: +m[1], end: +m[2] };
}

export function createClient(env) {
  const SUPA = env.SUPABASE_URL || DEFAULT_URL;
  const REST = `${SUPA}/rest/v1`;
  const AUTH = `${SUPA}/auth/v1`;
  const ANON = env.SUPABASE_ANON_KEY;
  const MEMBER_ID = env.MEMBER_ID;
  const KV = env.SHIFT_KV;
  const REF = new URL(SUPA).host.split(".")[0]; // supabase project ref
  const APP_URL = env.APP_URL || DEFAULT_APP_URL;
  let session = null; // full auth session (for the Slack server-action cookie)

  function authHeaders(jwt, write = false) {
    const h = {
      apikey: ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    };
    if (write) h.Prefer = "return=representation";
    return h;
  }

  async function persist(data) {
    await KV.put(
      SESSION_KEY,
      JSON.stringify({ refresh_token: data.refresh_token, expires_at: data.expires_at })
    );
  }

  async function tryRefresh() {
    const raw = await KV.get(SESSION_KEY);
    if (!raw) return null;
    let stored;
    try {
      stored = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!stored.refresh_token) return null;
    const r = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: stored.refresh_token }),
    });
    if (!r.ok) return null; // token rotated out / revoked -> caller falls back to password
    const data = await r.json();
    session = data; // closure session (used to build the Slack auth cookie)
    await persist(data);
    return data.access_token;
  }

  async function passwordLogin() {
    if (!env.EMAIL || !env.PASSWORD)
      throw new Error("Missing EMAIL/PASSWORD secret for login fallback");
    const r = await fetch(`${AUTH}/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: env.EMAIL, password: env.PASSWORD }),
    });
    if (!r.ok) throw new Error(`Password login failed: ${r.status} ${await r.text()}`);
    const data = await r.json();
    session = data;
    await persist(data);
    return data.access_token;
  }

  async function getAccessToken() {
    return (await tryRefresh()) || (await passwordLogin());
  }

  async function getTodayAssignments(jwt) {
    const today = ictParts().date;
    const url =
      `${REST}/shift_assignments` +
      `?select=id,shift_slot,is_sl,role,status,members!member_id(name)` +
      `&member_id=eq.${MEMBER_ID}` +
      `&shift_date=eq.${today}`;
    const r = await fetch(url, { headers: authHeaders(jwt) });
    if (!r.ok) throw new Error(`Get assignments failed: ${r.status} ${await r.text()}`);
    const rows = await r.json();
    // Sort by real shift start hour: DB "shift_slot.asc" is a string sort that puts
    // "14-17" before "8-11". Numeric ordering keeps the UI and the assignments[0]
    // fallback aligned with actual chronology (earliest shift first).
    return rows.sort((a, b) => (parseSlot(a.shift_slot)?.start ?? 99) - (parseSlot(b.shift_slot)?.start ?? 99));
  }

  // Latest check-in for an assignment: { state: 'none'|'open'|'closed', row }.
  async function getCheckinState(jwt, assignmentId) {
    const url =
      `${REST}/checkins` +
      `?select=id,checkin_time,checkout_time` +
      `&assignment_id=eq.${assignmentId}` +
      `&order=checkin_time.desc&limit=1`;
    const r = await fetch(url, { headers: authHeaders(jwt) });
    if (!r.ok) throw new Error(`Get checkin failed: ${r.status}`);
    const row = (await r.json())[0] || null;
    if (!row) return { state: "none", row: null };
    return { state: row.checkout_time ? "closed" : "open", row };
  }

  async function checkin(jwt, assignment) {
    const st = await getCheckinState(jwt, assignment.id);
    if (st.state === "open") return { skipped: true, reason: "already-open", row: st.row };
    const body = {
      assignment_id: assignment.id,
      member_id: MEMBER_ID,
      checkin_time: new Date().toISOString(),
      checkin_text: null,
    };
    const r = await fetch(`${REST}/checkins`, {
      method: "POST",
      headers: authHeaders(jwt, true),
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Check-in failed: ${r.status} ${await r.text()}`);
    return { skipped: false, row: (await r.json())[0] };
  }

  async function checkout(jwt, assignment) {
    const st = await getCheckinState(jwt, assignment.id);
    if (st.state !== "open") return { skipped: true, reason: "no-open-checkin" };
    const r = await fetch(`${REST}/checkins?id=eq.${st.row.id}`, {
      method: "PATCH",
      headers: authHeaders(jwt, true),
      body: JSON.stringify({ checkout_time: new Date().toISOString(), checkout_text: null }),
    });
    if (!r.ok) throw new Error(`Check-out failed: ${r.status} ${await r.text()}`);
    return { skipped: false, row: (await r.json())[0] };
  }

  // Open (no checkout yet) check-ins under OUR member_id, with the shift embedded.
  // A shift covered for someone else belongs to a different member, so it never appears
  // in getTodayAssignments — but the check-in row we wrote carries our member_id, so the
  // cover auto-checkout sweep finds it here. Restricted to today's shifts.
  async function getOpenCheckins(jwt) {
    const today = ictParts().date;
    const url =
      `${REST}/checkins` +
      `?select=id,checkin_time,assignment_id,` +
      `shift_assignments!assignment_id(shift_slot,shift_date,member_id,is_sl,role,members!member_id(name))` +
      `&member_id=eq.${MEMBER_ID}` +
      `&checkout_time=is.null`;
    const r = await fetch(url, { headers: authHeaders(jwt) });
    if (!r.ok) throw new Error(`Get open checkins failed: ${r.status} ${await r.text()}`);
    const rows = await r.json();
    // Today + yesterday: a shift that wraps past midnight (e.g. 23-2) has shift_date =
    // yesterday once we're into the small hours, so today-only would miss it.
    const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
    return rows.filter((x) => {
      const d = x.shift_assignments?.shift_date;
      return d === today || d === yesterday;
    });
  }

  // Close a specific check-in row by id. Used for covers, where we don't go through an
  // owned assignment. Mirrors checkout()'s write.
  async function checkoutById(jwt, rowId) {
    const r = await fetch(`${REST}/checkins?id=eq.${rowId}`, {
      method: "PATCH",
      headers: authHeaders(jwt, true),
      body: JSON.stringify({ checkout_time: new Date().toISOString(), checkout_text: null }),
    });
    if (!r.ok) throw new Error(`Cover check-out failed: ${r.status} ${await r.text()}`);
    return { skipped: false, row: (await r.json())[0] };
  }

  // ===== Slack notification (mirrors the web app's post-action server call) =====

  // @supabase/ssr auth cookie: sb-<ref>-auth-token = "base64-"+b64(session JSON),
  // split into .0/.1 chunks if long. The server action reads it to authenticate.
  function buildAuthCookie() {
    if (!session) return null;
    const name = `sb-${REF}-auth-token`;
    const payload = "base64-" + b64utf8(JSON.stringify(session));
    const CHUNK = 3180;
    if (payload.length <= CHUNK) return `${name}=${payload}`;
    const parts = [];
    for (let i = 0, p = 0; p < payload.length; i++, p += CHUNK)
      parts.push(`${name}.${i}=${payload.slice(p, p + CHUNK)}`);
    return parts.join("; ");
  }

  // The action id is build-specific (changes when the app redeploys); scrape it
  // from the public bundle so we self-heal instead of hard-coding a stale id.
  async function discoverActionId(cookie) {
    const html = await (
      await fetch(`${APP_URL}/dashboard/my-schedule`, {
        headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
        redirect: "manual",
      })
    ).text();
    const paths = [
      ...new Set([...html.matchAll(/\/_next\/static\/[^"'\\]+\.js/g)].map((m) => m[0])),
    ];
    const re = new RegExp('"([0-9a-f]{20,})"[^"]*"' + SLACK_ACTION_NAME + '"');
    for (const p of paths) {
      const js = await (await fetch(`${APP_URL}${p}`)).text();
      if (!js.includes(SLACK_ACTION_NAME)) continue;
      const m = re.exec(js);
      if (m) return m[1];
    }
    return null;
  }

  async function postAction(cookie, id, args) {
    const r = await fetch(`${APP_URL}/dashboard/my-schedule`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Next-Action": id,
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "text/x-component",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify(args),
    });
    const txt = await r.text();
    // Success looks like a flight stream ending in "<row>:true".
    return { ok: r.ok && /(?:^|\n)\d+:true\b/.test(txt), status: r.status, body: txt.slice(0, 160) };
  }

  // Fire the Slack notification for a completed action. Never throws —
  // a failed notification must not affect attendance recording.
  async function notifySlack(assignment, action) {
    try {
      const name = assignment?.members?.name;
      const role = assignment?.role || (assignment?.is_sl ? "SL" : "FL/TS");
      const slotRaw = assignment?.shift_slot;
      if (!name || !role || !slotRaw) return { sent: false, reason: "missing-fields" };
      const cookie = buildAuthCookie();
      if (!cookie) return { sent: false, reason: "no-session" };
      const args = [name, role, String(slotRaw).replace("-", ":00 - ") + ":00", action];

      let id = await KV.get(SLACK_ACTION_KEY);
      const fromCache = !!id;
      if (!id) {
        id = await discoverActionId(cookie);
        if (id) await KV.put(SLACK_ACTION_KEY, id);
      }
      if (!id) return { sent: false, reason: "action-id-not-found" };

      let res = await postAction(cookie, id, args);
      if (!res.ok && fromCache) {
        const fresh = await discoverActionId(cookie); // stale (app redeployed)? retry once
        if (fresh && fresh !== id) {
          await KV.put(SLACK_ACTION_KEY, fresh);
          res = await postAction(cookie, fresh, args);
        }
      }
      return { sent: res.ok, ...res };
    } catch (e) {
      return { sent: false, reason: "error", error: String(e?.message || e) };
    }
  }

  return { getAccessToken, getTodayAssignments, getCheckinState, checkin, checkout, getOpenCheckins, checkoutById, notifySlack };
}
