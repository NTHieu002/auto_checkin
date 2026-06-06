import { createClient, ictParts, parseSlot } from "./shift.js";
import { renderHTML } from "./ui.js";

const CONFIG_KEY = "config";

// Auto timing offsets (minutes): check in this many minutes BEFORE shift start, check
// out this many AFTER shift end. The trigger (Cloudflare cron AND/OR the external
// /cron pinger) fires repeatedly across the day; these constants — not the trigger
// cadence — define the exact moment each action happens. Idempotent reconciliation
// means extra/late fires are harmless.
const CHECKIN_LEAD_MIN = 5;
const CHECKOUT_LAG_MIN = 1;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Constant-time-ish PIN check against the UI_PIN secret.
function checkPin(request, env) {
  const pin = request.headers.get("x-pin") || "";
  const expected = env.UI_PIN || "";
  if (!expected || pin.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < pin.length; i++) diff |= pin.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function getConfig(env) {
  const raw = await env.SHIFT_KV.get(CONFIG_KEY);
  if (!raw) return { autoEnabled: true, skipDates: [], slackNotify: true };
  try {
    const c = JSON.parse(raw);
    return {
      autoEnabled: c.autoEnabled !== false,
      skipDates: c.skipDates || [],
      slackNotify: c.slackNotify !== false, // default on
    };
  } catch {
    return { autoEnabled: true, skipDates: [], slackNotify: true };
  }
}
async function saveConfig(env, c) {
  await env.SHIFT_KV.put(CONFIG_KEY, JSON.stringify(c));
}

async function handleStatus(env) {
  const c = createClient(env);
  const jwt = await c.getAccessToken();
  const assignments = await c.getTodayAssignments(jwt);
  const enriched = [];
  for (const a of assignments) {
    const st = await c.getCheckinState(jwt, a.id);
    enriched.push({
      ...a,
      state: st.state,
      checkin_time: st.row?.checkin_time || null,
      checkout_time: st.row?.checkout_time || null,
    });
  }
  const cfg = await getConfig(env);
  const ot = await c.getOtStats(jwt);
  const { date, hhmm } = ictParts();
  return {
    date,
    now: hhmm,
    assignments: enriched,
    ot,
    config: {
      autoEnabled: cfg.autoEnabled,
      skipToday: cfg.skipDates.includes(date),
      slackNotify: cfg.slackNotify,
    },
  };
}

async function handleAction(env, action, assignmentId) {
  const c = createClient(env);
  const jwt = await c.getAccessToken();
  const assignments = await c.getTodayAssignments(jwt);
  if (!assignments.length) return { error: "Không có shift hôm nay" };
  const a = assignments.find((x) => x.id === assignmentId) || assignments[0];
  const result = action === "checkin" ? await c.checkin(jwt, a) : await c.checkout(jwt, a);
  let slack;
  if (!result.skipped) {
    const cfg = await getConfig(env);
    if (cfg.slackNotify) {
      slack = await c.notifySlack(a, action);
      console.log(`[manual] slack ${action}`, JSON.stringify(slack));
    }
  }
  return { ok: true, action, result, slack };
}

async function handleConfig(env, body) {
  const cfg = await getConfig(env);
  const today = ictParts().date;
  cfg.skipDates = cfg.skipDates.filter((d) => d >= today); // prune past dates
  if (typeof body.autoEnabled === "boolean") cfg.autoEnabled = body.autoEnabled;
  if (typeof body.slackNotify === "boolean") cfg.slackNotify = body.slackNotify;
  if (typeof body.skipToday === "boolean") {
    if (body.skipToday) {
      if (!cfg.skipDates.includes(today)) cfg.skipDates.push(today);
    } else {
      cfg.skipDates = cfg.skipDates.filter((d) => d !== today);
    }
  }
  await saveConfig(env, cfg);
  return {
    ok: true,
    config: {
      autoEnabled: cfg.autoEnabled,
      skipToday: cfg.skipDates.includes(today),
      slackNotify: cfg.slackNotify,
    },
  };
}

// Cron reconciliation: check in at shift start, check out at shift end.
// Idempotent and self-correcting, so a missed/late fire still does the right thing.
// Returns a summary of what it did (surfaced over /cron, since Cloudflare logs aren't
// queryable via API on this account).
async function runAuto(env) {
  const cfg = await getConfig(env);
  const { date, hour, minute } = ictParts();
  const now = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  if (!cfg.autoEnabled) { console.log("[auto] disabled"); return { date, now, skipped: "disabled" }; }
  if (cfg.skipDates.includes(date)) { console.log(`[auto] skip ${date}`); return { date, now, skipped: "skip-date" }; }

  const c = createClient(env);
  const jwt = await c.getAccessToken();
  const assignments = await c.getTodayAssignments(jwt);
  // NOTE: do NOT early-return when assignments is empty. A day with no *own* shift can
  // still have open *cover* check-ins that need closing (covers belong to other members,
  // so they never appear here). The own-shift loop below is a no-op on an empty array,
  // and the cover sweep that follows must always run.
  if (!assignments.length) console.log(`[auto] no own shift ${date} (cover sweep still runs)`);

  const nowMin = hour * 60 + minute;
  const actions = [];
  for (const a of assignments) {
    const slot = parseSlot(a.shift_slot);
    if (!slot) continue;
    const shiftEnd = slot.end * 60;
    const checkinAt = slot.start * 60 - CHECKIN_LEAD_MIN;
    const checkoutAt = shiftEnd + CHECKOUT_LAG_MIN;
    const st = await c.getCheckinState(jwt, a.id);
    if (nowMin >= checkinAt && nowMin < shiftEnd && st.state === "none") {
      const r = await c.checkin(jwt, a);
      console.log(`[auto] checkin ${a.shift_slot}`, JSON.stringify(r));
      let slack;
      if (!r.skipped && cfg.slackNotify) {
        slack = await c.notifySlack(a, "checkin");
        console.log(`[auto] slack checkin`, JSON.stringify(slack));
      }
      actions.push({ slot: a.shift_slot, action: "checkin", skipped: !!r.skipped, slack });
    } else if (nowMin >= checkoutAt && st.state === "open") {
      const r = await c.checkout(jwt, a);
      console.log(`[auto] checkout ${a.shift_slot}`, JSON.stringify(r));
      let slack;
      if (!r.skipped && cfg.slackNotify) {
        slack = await c.notifySlack(a, "checkout");
        console.log(`[auto] slack checkout`, JSON.stringify(slack));
      }
      actions.push({ slot: a.shift_slot, action: "checkout", skipped: !!r.skipped, slack });
    }
  }

  // Cover sweep: auto check-OUT *every* shift being covered for someone else, at any
  // hour and any date — not just the daytime window. Such a shift belongs to a different
  // member (so it's absent from `assignments` above), but the open check-in carries our
  // member_id. We never auto check-IN covers (can't detect a cover before its check-in
  // exists) and never fire Slack for them (Slack would post under the shift owner's name).
  // Timing is computed on the FULL end datetime (date + hour), so it handles shifts that
  // wrap past midnight (e.g. 23-2 ends 02:00 the next day). For this to fire near the real
  // end of out-of-window shifts (2-5, 23-2), the external trigger must run ~24/7; if it
  // only fires daytime, the checkout still happens — just at the next fire (late).
  const covers = [];
  const open = await c.getOpenCheckins(jwt);
  const dayMs = 86400000;
  const nowAbs = Date.parse(`${date}T00:00:00Z`) / 60000 + nowMin; // ICT minutes, absolute
  for (const ci of open) {
    const a = ci.shift_assignments;
    if (!a || a.member_id === env.MEMBER_ID) continue; // own shifts handled above
    const slot = parseSlot(a.shift_slot);
    if (!slot) continue;
    // End datetime: if the slot wraps midnight (end <= start) it ends on shift_date + 1.
    let endMs = Date.parse(`${a.shift_date}T00:00:00Z`);
    if (slot.end <= slot.start) endMs += dayMs;
    const endDate = new Date(endMs).toISOString().slice(0, 10);
    const dueAbs = endMs / 60000 + slot.end * 60 + CHECKOUT_LAG_MIN;
    const dueAt = `${endDate} ${String(slot.end).padStart(2, "0")}:${String(CHECKOUT_LAG_MIN).padStart(2, "0")}`;
    let acted = false;
    if (nowAbs >= dueAbs) {
      const r = await c.checkoutById(jwt, ci.id);
      console.log(`[auto] cover checkout ${a.shift_slot} ${a.shift_date} (owner ${a.members?.name})`, JSON.stringify(r));
      acted = !r.skipped;
    }
    covers.push({ slot: a.shift_slot, date: a.shift_date, owner: a.members?.name || null, dueAt, acted });
  }

  return { date, now, shifts: assignments.length, actions, covers };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      return new Response(renderHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // External trigger: an outside scheduler (cron-job.org) GETs this every ~5 min to
    // drive runAuto, because Cloudflare's free-tier cron is unreliable for this worker.
    // Gated by the CRON_KEY secret (header x-cron-key or ?key=). Disabled until set.
    if (path === "/cron") {
      const key = request.headers.get("x-cron-key") || url.searchParams.get("key") || "";
      if (!env.CRON_KEY || key !== env.CRON_KEY) return json({ error: "unauthorized" }, 401);
      try {
        return json(await runAuto(env));
      } catch (e) {
        return json({ error: e.message || String(e) }, 500);
      }
    }

    if (path.startsWith("/api/")) {
      if (!checkPin(request, env)) return json({ error: "unauthorized" }, 401);
      try {
        if (path === "/api/login") return json({ ok: true });
        if (path === "/api/status") return json(await handleStatus(env));
        const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
        if (path === "/api/checkin") return json(await handleAction(env, "checkin", body.assignmentId));
        if (path === "/api/checkout") return json(await handleAction(env, "checkout", body.assignmentId));
        if (path === "/api/config") return json(await handleConfig(env, body));
        return json({ error: "not found" }, 404);
      } catch (e) {
        return json({ error: e.message || String(e) }, 500);
      }
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runAuto(env).catch((e) => console.error("[auto] error", e.stack || e.message)));
  },
};
