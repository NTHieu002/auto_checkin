// Single-page mobile/desktop UI served at "/". Daytime Mt. Fuji + sakura photo theme.
// Client JS avoids template literals/${} so it can live safely inside this template.
// (CSS may use ${} — it's interpolated server-side when renderHTML runs.)
import { BG } from "./bg.js";
export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#8fc3e6">
<title>Shift Auto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0a0f1f;--card:rgba(17,25,48,.74);--card2:rgba(38,50,86,.7);
    --txt:#e9eefb;--muted:#9fb0d6;--line:rgba(130,150,200,.22);
    --accent:#7fd0ff;--gold:#ffcf6b;--green:#52c97a;--red:#ef6b6b;--sakura:#f4b6d0;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;min-height:100%}
  body{background:var(--bg);color:var(--txt);overflow-x:hidden;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
  .px{font-family:"Press Start 2P",monospace}

  /* ===== Daytime Mt. Fuji + sakura photo scene (z0) ===== */
  .scene{position:fixed;inset:0;z-index:0;background:#cfe8f7 center/cover no-repeat fixed;
    background-image:url(${BG})}
  .scene::after{content:"";position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(6,12,28,.34) 0%,rgba(8,16,34,.05) 22%,rgba(8,16,34,.12) 52%,rgba(6,12,28,.56) 100%)}
  /* falling sakura petals */
  .petals{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .petal{position:absolute;top:-16px;width:9px;height:9px;background:var(--sakura);border-radius:9px 1px 9px 1px;opacity:.85;
    animation:petal linear infinite}
  @keyframes petal{0%{transform:translateY(-20px) translateX(0) rotate(0)}
    100%{transform:translateY(102vh) translateX(60px) rotate(420deg)}}

  /* ===== Content ===== */
  .wrap{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:20px 16px 40px}
  .hd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
  .logo{font-size:15px;color:var(--gold);text-shadow:2px 2px 0 #000}
  .sub{color:var(--muted);font-size:13px;margin-top:6px}
  .sect{font-size:13px;color:var(--muted);margin:18px 2px 8px;letter-spacing:.5px;text-transform:uppercase}
  h1{font-size:20px;margin:0}
  .grid{display:grid;grid-template-columns:1fr;gap:16px}
  @media(min-width:780px){.grid{grid-template-columns:1.05fr .95fr;align-items:start}}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:14px;
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.35)}
  .col>.card:first-child{margin-top:0}
  .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .slot{font-size:22px;font-weight:700}
  .role{color:var(--muted);font-size:13px}
  .badge{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap}
  .b-none{background:rgba(120,140,190,.25);color:#dbe4fb}
  .b-open{background:rgba(82,201,122,.18);color:var(--green)}
  .b-closed{background:rgba(127,208,255,.16);color:var(--accent)}
  .times{margin-top:10px;font-size:13px;color:var(--muted);line-height:1.6}
  .btns{display:flex;gap:10px;margin-top:14px}
  button{font:inherit;border:0;border-radius:12px;padding:12px;font-weight:600;cursor:pointer;flex:1;color:#fff;transition:opacity .15s,transform .05s}
  button:active{opacity:.7;transform:translateY(1px)}
  button:disabled{opacity:.35;cursor:default}
  .bi{background:var(--green)}
  .bo{background:var(--gold);color:#1a1206}
  .switch{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line)}
  .switch:first-child{border-top:0}
  .toggle{width:50px;height:30px;border-radius:999px;background:#43506f;position:relative;flex:0 0 auto;transition:background .2s}
  .toggle.on{background:var(--green)}
  .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s}
  .toggle.on .knob{left:23px}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0b1220;border:1px solid var(--line);
    padding:10px 16px;border-radius:12px;font-size:14px;max-width:90%;opacity:0;transition:opacity .2s;pointer-events:none;z-index:30}
  .toast.show{opacity:1}
  .toast.err{border-color:var(--red);color:#fecaca}
  input{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:rgba(10,15,31,.6);
    color:var(--txt);font-size:18px;text-align:center;letter-spacing:4px}
  .muted{color:var(--muted);font-size:13px}
  .center{text-align:center}
  .link{color:var(--accent);font-size:13px;background:none;flex:0;padding:4px;width:auto}
  .spin{display:inline-block;width:16px;height:16px;border:2px solid #fff5;border-top-color:#fff;border-radius:50%;animation:s .7s linear infinite;vertical-align:-3px}
  @keyframes s{to{transform:rotate(360deg)}}

  /* ===== OT block (night, lantern-lit) ===== */
  .ot .ot-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  .ot .ot-name{font-size:11px;color:var(--gold);text-shadow:1px 1px 0 #000}
  .ot-tabs{display:flex;gap:8px;margin-bottom:14px}
  .ot-tab{flex:1;background:var(--card2);color:#cfe0ff;border-radius:10px;padding:9px;font-size:13px;font-weight:600}
  .ot-tab.on{background:var(--gold);color:#1a1206}
  .ot-stat{display:flex;align-items:baseline;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line)}
  .ot-stat:first-of-type{border-top:0}
  .ot-k{color:var(--muted);font-size:13px}
  .ot-v{font-size:13px;color:#eafff0}
  .ot-money{margin-top:2px}
  .ot-money .ot-k{color:var(--gold)}
  .ot-money .ot-v{color:var(--gold);font-size:15px}
  .ot-sub{margin-top:10px;color:var(--muted);font-size:12px;text-align:right}
</style>
</head>
<body>
<div class="scene"></div>
<div class="petals">
  <span class="petal" style="left:6%;animation-duration:9s;animation-delay:0s"></span>
  <span class="petal" style="left:18%;animation-duration:12s;animation-delay:2s"></span>
  <span class="petal" style="left:30%;animation-duration:10s;animation-delay:4s"></span>
  <span class="petal" style="left:44%;animation-duration:13s;animation-delay:1s"></span>
  <span class="petal" style="left:57%;animation-duration:8s;animation-delay:3s"></span>
  <span class="petal" style="left:69%;animation-duration:11s;animation-delay:5s"></span>
  <span class="petal" style="left:81%;animation-duration:10s;animation-delay:1.5s"></span>
  <span class="petal" style="left:93%;animation-duration:12s;animation-delay:3.5s"></span>
</div>

<div class="wrap">
  <!-- PIN gate -->
  <div id="gate" style="display:none">
    <div class="center" style="margin-top:8vh">
      <div class="logo px" style="font-size:20px">SHIFT AUTO</div>
      <p class="muted" style="margin-top:14px">Nhập mã PIN để tiếp tục</p>
    </div>
    <div class="card" style="max-width:360px;margin:14px auto 0">
      <input id="pin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off">
      <div class="btns"><button class="bo" id="pinBtn">Vào</button></div>
    </div>
  </div>

  <!-- App -->
  <div id="app" style="display:none">
    <div class="hd">
      <div><div class="logo px">SHIFT AUTO</div><div class="sub" id="dateline">—</div></div>
      <button class="link" id="refreshBtn">↻ Tải lại</button>
    </div>

    <div class="grid">
      <div class="col">
        <div class="sect">Ca hôm nay</div>
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
      </div>

      <div class="col">
        <div class="sect">Thống kê OT</div>
        <div class="card ot" id="otCard" style="display:none">
          <div class="ot-head"><span class="ot-name px">&#9962; GIO OT</span></div>
          <div class="ot-tabs">
            <button class="ot-tab on" id="otTabMonth">Tháng này</button>
            <button class="ot-tab" id="otTabAll">Tất cả</button>
          </div>
          <div class="ot-stat"><span class="ot-k">Số giờ thực</span><span class="ot-v px" id="otRaw">—</span></div>
          <div class="ot-stat"><span class="ot-k">Đã ×hệ số</span><span class="ot-v px" id="otMult">—</span></div>
          <div class="ot-stat ot-money"><span class="ot-k">Thực nhận</span><span class="ot-v px" id="otMoney">—</span></div>
          <div class="ot-sub" id="otSub"></div>
        </div>
      </div>
    </div>

    <div class="center" style="margin-top:18px">
      <button class="link" id="logoutBtn">Đăng xuất</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
  var PIN = localStorage.getItem("shiftPin") || "";
  var busy = false;
  var OT = null, otView = "month";

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
    renderOt(data.ot);
    setToggle($("tgAuto"), data.config.autoEnabled);
    setToggle($("tgSkip"), data.config.skipToday);
    setToggle($("tgSlack"), data.config.slackNotify);
  }
  function setToggle(el, on){ el.className = "toggle" + (on ? " on" : ""); }

  function fmtH(h){ return (Math.round(h * 10) / 10) + "h"; }
  function fmtMoney(v){ return (v || 0).toLocaleString("vi-VN") + "đ"; }
  function renderOt(ot){
    OT = ot;
    if(!ot){ $("otCard").style.display = "none"; return; }
    $("otCard").style.display = "block";
    paintOt();
  }
  function paintOt(){
    if(!OT) return;
    var d = (otView === "all" ? OT.all : OT.month) || {};
    $("otRaw").textContent = fmtH(d.rawHours);
    $("otMult").textContent = fmtH(d.multHours);
    $("otMoney").textContent = fmtMoney(d.money);
    $("otSub").textContent = (d.count || 0) + " ca OT"
      + (otView === "all" ? " · toàn bộ" : " · tháng " + OT.thisMonth)
      + " · " + fmtMoney(OT.rate) + "/h";
    $("otTabMonth").className = "ot-tab" + (otView === "month" ? " on" : "");
    $("otTabAll").className = "ot-tab" + (otView === "all" ? " on" : "");
  }

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

  $("otTabMonth").onclick = function(){ otView = "month"; paintOt(); };
  $("otTabAll").onclick = function(){ otView = "all"; paintOt(); };

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
