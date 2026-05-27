#!/usr/bin/env node
/**
 * auto-shift.js — Auto check-in/check-out cho Shift Manager
 * Usage:
 *   node auto-shift.js checkin
 *   node auto-shift.js checkout
 *   node auto-shift.js status
 *
 * Yêu cầu: Node.js >= 18 (có fetch built-in)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== CONFIG (đọc từ env) =====
const SUPABASE = process.env.SUPABASE_URL || "https://qktvfncduxmoijzfqbdb.supabase.co";
const REST = `${SUPABASE}/rest/v1`;
const AUTH = `${SUPABASE}/auth/v1`;
const ANON = process.env.SUPABASE_ANON_KEY;
const MEMBER_ID = process.env.MEMBER_ID;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, ".shift-state.json");

if (!ANON) die("Missing env SUPABASE_ANON_KEY");
if (!MEMBER_ID) die("Missing env MEMBER_ID");

// ===== STATE (refresh_token được rotate, phải persist) =====
async function loadState() {
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
  } catch {
    return process.env.INITIAL_REFRESH_TOKEN
      ? { refresh_token: process.env.INITIAL_REFRESH_TOKEN }
      : {};
  }
}
async function saveState(s) {
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2), { mode: 0o600 });
}

// ===== AUTH =====
async function persistTokens(state, data) {
  state.refresh_token = data.refresh_token;
  state.access_token = data.access_token;
  state.expires_at = data.expires_at;
  await saveState(state);
}

// Try the stored refresh token. Returns access token, or null if it's
// rejected/absent (so the caller can fall back to password login).
async function refreshAccessToken(state) {
  if (!state.refresh_token) return null;
  const r = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: state.refresh_token }),
  });
  if (!r.ok) {
    console.error(`⚠️  Refresh token bị từ chối (${r.status}), thử đăng nhập lại bằng email/password...`);
    return null;
  }
  const data = await r.json();
  await persistTokens(state, data);
  return data.access_token;
}

// Independent session via email+password. Used to bootstrap and to recover
// when the refresh-token chain dies (e.g. browser rotated it out).
async function passwordLogin(state) {
  if (!EMAIL || !PASSWORD)
    die("Refresh token không dùng được và thiếu EMAIL/PASSWORD trong env để đăng nhập lại.");
  const r = await fetch(`${AUTH}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) die(`Password login failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  await persistTokens(state, data);
  console.log("🔑 Đăng nhập lại bằng email/password thành công.");
  return data.access_token;
}

async function getAccessToken(state) {
  return (await refreshAccessToken(state)) || passwordLogin(state);
}

function headers(jwt, withReturn = true) {
  const h = {
    apikey: ANON,
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
  if (withReturn) h.Prefer = "return=representation";
  return h;
}

// ===== API CALLS =====
async function getTodayAssignments(jwt) {
  const today = todayISODate();
  const url =
    `${REST}/shift_assignments` +
    `?select=id,shift_slot,is_sl,role,status` +
    `&member_id=eq.${MEMBER_ID}` +
    `&shift_date=eq.${today}` +
    `&order=shift_slot.asc`;
  const r = await fetch(url, { headers: headers(jwt, false) });
  if (!r.ok) die(`Get assignment failed: ${r.status} ${await r.text()}`);
  return r.json();
}

// shift_slot dạng "8-11" / "14-17". True nếu giờ hiện tại nằm trong ca.
// Cho phép chạy nhiều cron (sáng + chiều) mà không check-in nhầm ca.
function shiftMatchesNow(slot) {
  const m = String(slot).match(/(\d{1,2})(?::\d{2})?\s*-\s*(\d{1,2})/);
  if (!m) return true; // không parse được thì không chặn
  const hour = new Date().getHours();
  return hour >= +m[1] && hour <= +m[2];
}

// Chọn ca khớp giờ hiện tại (cho check-in/check-out). null nếu không có ca nào khớp.
function pickShiftForNow(assignments) {
  const matching = assignments.filter(a => shiftMatchesNow(a.shift_slot));
  if (matching.length === 0) return null;
  return matching.find(a => a.status === "scheduled" || a.status === "checked_in") || matching[0];
}

async function findOpenCheckin(jwt, assignmentId) {
  const url =
    `${REST}/checkins` +
    `?select=id,checkin_time,checkout_time` +
    `&assignment_id=eq.${assignmentId}` +
    `&checkout_time=is.null` +
    `&order=checkin_time.desc&limit=1`;
  const r = await fetch(url, { headers: headers(jwt, false) });
  if (!r.ok) die(`Find open checkin failed: ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}

async function findTodayCheckin(jwt, assignmentId) {
  const url =
    `${REST}/checkins` +
    `?select=id,checkin_time,checkout_time` +
    `&assignment_id=eq.${assignmentId}` +
    `&order=checkin_time.desc&limit=1`;
  const r = await fetch(url, { headers: headers(jwt, false) });
  if (!r.ok) die(`Find checkin failed: ${r.status}`);
  const arr = await r.json();
  return arr[0] || null;
}

async function doCheckin(jwt, assignment) {
  // Idempotency: nếu hôm nay đã có checkin và chưa checkout, skip
  const existing = await findOpenCheckin(jwt, assignment.id);
  if (existing) {
    console.log(`ℹ️  Đã check-in trước đó lúc ${existing.checkin_time}, skip.`);
    return existing;
  }
  const body = {
    assignment_id: assignment.id,
    member_id: MEMBER_ID,
    checkin_time: new Date().toISOString(),
    checkin_text: null,
  };
  const r = await fetch(`${REST}/checkins`, {
    method: "POST",
    headers: headers(jwt),
    body: JSON.stringify(body),
  });
  if (!r.ok) die(`Check-in failed: ${r.status} ${await r.text()}`);
  const row = (await r.json())[0];
  console.log(`✅ Checked in: id=${row.id} time=${row.checkin_time} role=${row.role}`);
  return row;
}

async function doCheckout(jwt, assignment) {
  const open = await findOpenCheckin(jwt, assignment.id);
  if (!open) die("Không tìm thấy check-in đang mở cho shift hôm nay.");
  const r = await fetch(`${REST}/checkins?id=eq.${open.id}`, {
    method: "PATCH",
    headers: headers(jwt),
    body: JSON.stringify({
      checkout_time: new Date().toISOString(),
      checkout_text: null,
    }),
  });
  if (!r.ok) die(`Check-out failed: ${r.status} ${await r.text()}`);
  const row = (await r.json())[0];
  console.log(`✅ Checked out: id=${row.id} time=${row.checkout_time}`);
  return row;
}

async function doStatus(jwt, assignment) {
  console.log("📋 Shift hôm nay:", assignment);
  const last = await findTodayCheckin(jwt, assignment.id);
  if (!last) console.log("   ⏳ Chưa check-in.");
  else if (!last.checkout_time)
    console.log(`   🟢 Đang trong ca, check-in lúc ${last.checkin_time}`);
  else
    console.log(
      `   ✔️  Đã hoàn thành: in=${last.checkin_time} out=${last.checkout_time}`
    );
}

// ===== UTILS =====
function todayISODate() {
  // Lấy theo timezone local của máy, format YYYY-MM-DD
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 10);
}
function die(msg) {
  console.error("❌", msg);
  process.exit(1);
}

// ===== MAIN =====
async function main() {
  const action = (process.argv[2] || "").toLowerCase();
  if (!["checkin", "checkout", "status"].includes(action)) {
    console.log("Usage: node auto-shift.js <checkin|checkout|status>");
    process.exit(1);
  }
  const state = await loadState();
  const jwt = await getAccessToken(state);
  const today = todayISODate();
  const assignments = await getTodayAssignments(jwt);

  if (action === "status") {
    if (assignments.length === 0) return console.log(`📋 Không có shift hôm nay (${today}).`);
    const a = assignments.find(x => x.status === "scheduled" || x.status === "checked_in") || assignments[0];
    return doStatus(jwt, a);
  }

  if (assignments.length === 0)
    return console.log(`ℹ️  Không có shift hôm nay (${today}), bỏ qua.`);

  const assignment = pickShiftForNow(assignments);
  if (!assignment)
    return console.log(`ℹ️  Không có ca khớp giờ hiện tại (${new Date().toTimeString().slice(0, 5)}), bỏ qua.`);

  if (action === "checkin") await doCheckin(jwt, assignment);
  else await doCheckout(jwt, assignment);
}

main().catch((e) => die(e.stack || e.message));
