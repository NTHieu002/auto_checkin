// Supabase Shift Manager client for Cloudflare Workers.
// Stateless per request; persists the rotating refresh token in KV.

const DEFAULT_URL = "https://qktvfncduxmoijzfqbdb.supabase.co";
const SESSION_KEY = "session"; // KV key holding { refresh_token, ... }

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
    let session;
    try {
      session = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!session.refresh_token) return null;
    const r = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!r.ok) return null; // token rotated out / revoked -> caller falls back to password
    const data = await r.json();
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
      `?select=id,shift_slot,is_sl,role,status` +
      `&member_id=eq.${MEMBER_ID}` +
      `&shift_date=eq.${today}` +
      `&order=shift_slot.asc`;
    const r = await fetch(url, { headers: authHeaders(jwt) });
    if (!r.ok) throw new Error(`Get assignments failed: ${r.status} ${await r.text()}`);
    return r.json();
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

  return { getAccessToken, getTodayAssignments, getCheckinState, checkin, checkout };
}
