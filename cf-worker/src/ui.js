// Single-page mobile UI served at "/". Client JS avoids template literals/${}
// so it can live safely inside this module's template string.
export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f172a">
<title>Shift Auto</title>
<style>
  :root{--bg:#0f172a;--card:#1e293b;--card2:#334155;--txt:#e2e8f0;--muted:#94a3b8;
    --accent:#38bdf8;--green:#22c55e;--amber:#f59e0b;--red:#ef4444;--line:#334155;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;background:var(--bg);color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
  .wrap{max-width:460px;margin:0 auto;padding:18px}
  h1{font-size:20px;margin:0}
  .sub{color:var(--muted);font-size:13px;margin-top:2px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;
    padding:16px;margin-top:14px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .slot{font-size:22px;font-weight:700}
  .role{color:var(--muted);font-size:13px}
  .badge{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap}
  .b-none{background:#475569;color:#e2e8f0}
  .b-open{background:rgba(34,197,94,.15);color:var(--green)}
  .b-closed{background:rgba(56,189,248,.15);color:var(--accent)}
  .times{margin-top:10px;font-size:13px;color:var(--muted);line-height:1.6}
  .btns{display:flex;gap:10px;margin-top:14px}
  button{font:inherit;border:0;border-radius:12px;padding:12px;font-weight:600;
    cursor:pointer;flex:1;color:#fff;transition:opacity .15s}
  button:active{opacity:.7}
  button:disabled{opacity:.35;cursor:default}
  .bi{background:var(--green)}
  .bo{background:var(--accent);color:#0f172a}
  .ghost{background:var(--card2);color:var(--txt)}
  .switch{display:flex;align-items:center;justify-content:space-between;
    padding:12px 0;border-top:1px solid var(--line)}
  .switch:first-child{border-top:0}
  .toggle{width:50px;height:30px;border-radius:999px;background:#475569;
    position:relative;flex:0 0 auto;transition:background .2s}
  .toggle.on{background:var(--green)}
  .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;
    background:#fff;transition:left .2s}
  .toggle.on .knob{left:23px}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
    background:#0b1220;border:1px solid var(--line);padding:10px 16px;border-radius:12px;
    font-size:14px;max-width:90%;opacity:0;transition:opacity .2s;pointer-events:none;z-index:9}
  .toast.show{opacity:1}
  .toast.err{border-color:var(--red);color:#fecaca}
  input{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);
    background:var(--card);color:var(--txt);font-size:18px;text-align:center;letter-spacing:4px}
  .muted{color:var(--muted);font-size:13px}
  .center{text-align:center}
  .link{color:var(--accent);font-size:13px;background:none;flex:0;padding:4px}
  .spin{display:inline-block;width:16px;height:16px;border:2px solid #fff5;
    border-top-color:#fff;border-radius:50%;animation:s .7s linear infinite;vertical-align:-3px}
  @keyframes s{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="wrap">
  <!-- PIN gate -->
  <div id="gate" style="display:none">
    <div class="center" style="margin-top:40px">
      <h1>Shift Auto</h1>
      <p class="muted">Nhập mã PIN để tiếp tục</p>
    </div>
    <div class="card">
      <input id="pin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off">
      <div class="btns"><button class="bo" id="pinBtn">Vào</button></div>
    </div>
  </div>

  <!-- App -->
  <div id="app" style="display:none">
    <div class="row">
      <div><h1>Ca hôm nay</h1><div class="sub" id="dateline">—</div></div>
      <button class="link" id="refreshBtn">↻ Tải lại</button>
    </div>
    <div id="shifts"></div>
    <div class="card">
      <div class="switch">
        <div><div style="font-weight:600">Tự động check-in/out</div>
          <div class="muted">Chạy trên cloud theo giờ ca</div></div>
        <div class="toggle" id="tgAuto"><div class="knob"></div></div>
      </div>
      <div class="switch">
        <div><div style="font-weight:600">Bỏ qua hôm nay</div>
          <div class="muted">Không tự động trong hôm nay</div></div>
        <div class="toggle" id="tgSkip"><div class="knob"></div></div>
      </div>
      <div class="switch">
        <div><div style="font-weight:600">Báo Slack</div>
          <div class="muted">Gửi thông báo Slack khi check-in/out</div></div>
        <div class="toggle" id="tgSlack"><div class="knob"></div></div>
      </div>
    </div>
    <div class="center" style="margin-top:16px">
      <button class="link" id="logoutBtn">Đăng xuất</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
  var PIN = localStorage.getItem("shiftPin") || "";
  var busy = false;

  function $(id){ return document.getElementById(id); }
  function toast(msg, isErr){
    var t = $("toast"); t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    setTimeout(function(){ t.className = "toast"; }, 2600);
  }
  function api(path, body){
    return fetch("/api/" + path, {
      method: body ? "POST" : "GET",
      headers: { "x-pin": PIN, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    }).then(function(r){
      return r.json().then(function(j){
        if(!r.ok) throw new Error(j.error || ("HTTP " + r.status));
        return j;
      });
    });
  }

  function showGate(){ $("gate").style.display = "block"; $("app").style.display = "none"; }
  function showApp(){ $("gate").style.display = "none"; $("app").style.display = "block"; load(); }

  function badge(state){
    if(state === "open") return '<span class="badge b-open">🟢 Đang trong ca</span>';
    if(state === "closed") return '<span class="badge b-closed">✔️ Đã xong</span>';
    return '<span class="badge b-none">⏳ Chưa check-in</span>';
  }
  function fmt(iso){
    if(!iso) return "—";
    var d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Ho_Chi_Minh" });
  }

  function render(data){
    $("dateline").textContent = data.date + " · bây giờ " + data.now;
    var box = $("shifts");
    if(!data.assignments.length){
      box.innerHTML = '<div class="card center muted">Không có ca nào hôm nay 🎉</div>';
    } else {
      box.innerHTML = data.assignments.map(function(a){
        var canIn = a.state === "none";
        var canOut = a.state === "open";
        return '<div class="card">'
          + '<div class="row"><div><div class="slot">' + a.shift_slot + '</div>'
          + '<div class="role">Vai trò: ' + (a.role || (a.is_sl ? "SL" : "FL/TS")) + '</div></div>'
          + badge(a.state) + '</div>'
          + '<div class="times">Check-in: ' + fmt(a.checkin_time) + ' &nbsp;·&nbsp; Check-out: ' + fmt(a.checkout_time) + '</div>'
          + '<div class="btns">'
          + '<button class="bi" ' + (canIn?"":"disabled") + ' onclick="act(\\'checkin\\',\\'' + a.id + '\\')">Check in</button>'
          + '<button class="bo" ' + (canOut?"":"disabled") + ' onclick="act(\\'checkout\\',\\'' + a.id + '\\')">Check out</button>'
          + '</div></div>';
      }).join("");
    }
    setToggle($("tgAuto"), data.config.autoEnabled);
    setToggle($("tgSkip"), data.config.skipToday);
    setToggle($("tgSlack"), data.config.slackNotify);
  }
  function setToggle(el, on){ el.className = "toggle" + (on ? " on" : ""); }

  function load(){
    api("status").then(render).catch(function(e){
      if(/unauthorized/i.test(e.message)){ PIN=""; localStorage.removeItem("shiftPin"); showGate(); }
      else toast(e.message, true);
    });
  }

  window.act = function(action, id){
    if(busy) return; busy = true;
    toast(action === "checkin" ? "Đang check-in…" : "Đang check-out…");
    api(action, { assignmentId: id }).then(function(r){
      var res = r.result || {};
      if(res.skipped) toast("Bỏ qua: " + res.reason);
      else toast(action === "checkin" ? "✅ Đã check-in" : "✅ Đã check-out");
      load();
    }).catch(function(e){ toast(e.message, true); }).finally(function(){ busy = false; });
  };

  $("tgAuto").onclick = function(){
    var on = !this.classList.contains("on");
    setToggle(this, on);
    api("config", { autoEnabled: on }).then(function(r){
      toast(r.config.autoEnabled ? "Đã bật tự động" : "Đã tắt tự động");
    }).catch(function(e){ toast(e.message, true); load(); });
  };
  $("tgSkip").onclick = function(){
    var on = !this.classList.contains("on");
    setToggle(this, on);
    api("config", { skipToday: on }).then(function(r){
      toast(r.config.skipToday ? "Hôm nay sẽ không tự động" : "Hôm nay tự động bình thường");
    }).catch(function(e){ toast(e.message, true); load(); });
  };
  $("tgSlack").onclick = function(){
    var on = !this.classList.contains("on");
    setToggle(this, on);
    api("config", { slackNotify: on }).then(function(r){
      toast(r.config.slackNotify ? "Đã bật báo Slack" : "Đã tắt báo Slack");
    }).catch(function(e){ toast(e.message, true); load(); });
  };

  $("refreshBtn").onclick = load;
  $("logoutBtn").onclick = function(){ PIN=""; localStorage.removeItem("shiftPin"); showGate(); };

  $("pinBtn").onclick = function(){
    var v = $("pin").value.trim();
    if(!v) return;
    PIN = v;
    api("login").then(function(){
      localStorage.setItem("shiftPin", PIN); showApp();
    }).catch(function(){ PIN=""; toast("PIN sai", true); });
  };
  $("pin").addEventListener("keydown", function(e){ if(e.key === "Enter") $("pinBtn").click(); });

  if(PIN) showApp(); else showGate();
</script>
</body>
</html>`;
}
