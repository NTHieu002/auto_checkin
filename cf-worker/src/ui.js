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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
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
  .otbig{font-size:18px;font-weight:700;color:var(--accent)}
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

  /* ===== OT block — Japanese pixel-art scene ===== */
  .ot{padding:0;overflow:hidden}
  .ot-scene{position:relative;height:160px;overflow:hidden;image-rendering:pixelated;
    background:linear-gradient(#a9def6 0%,#cdeefb 42%,#bfe9c4 42%,#a9dcae 100%)}
  /* drifting clouds */
  .ot-cloud{position:absolute;background:#fff;border-radius:8px;opacity:.9;
    box-shadow:14px 6px 0 0 #fff,28px 0 0 -2px #fff}
  .ot-cloud.c1{top:16px;width:22px;height:10px;animation:drift 26s linear infinite}
  .ot-cloud.c2{top:34px;width:16px;height:8px;opacity:.7;animation:drift 38s linear infinite}
  @keyframes drift{from{left:-60px}to{left:120%}}
  /* sun */
  .ot-sun{position:absolute;top:14px;right:20px;width:24px;height:24px;border-radius:50%;
    background:#ffd45e;box-shadow:0 0 0 5px rgba(255,229,150,.5)}
  /* Mt. Fuji */
  .ot-fuji{position:absolute;bottom:54px;left:50%;transform:translateX(-50%);
    width:0;height:0;border-left:78px solid transparent;border-right:78px solid transparent;
    border-bottom:64px solid #8aa0c8}
  .ot-fuji::after{content:"";position:absolute;left:-22px;top:0;width:0;height:0;
    border-left:22px solid transparent;border-right:22px solid transparent;border-bottom:18px solid #f5f7ff}
  /* cliff + waterfall */
  .ot-cliff{position:absolute;top:40px;left:30px;width:34px;height:78px;background:#6b5847;
    border-radius:0 0 4px 4px;box-shadow:inset -4px 0 0 #5a4838,inset 4px 0 0 #7d6a57}
  .ot-fall{position:absolute;top:42px;left:38px;width:18px;height:72px;overflow:hidden;
    background:#dff4ff;box-shadow:0 0 6px rgba(190,233,255,.9)}
  .ot-fall::before{content:"";position:absolute;inset:-12px 0;
    background:repeating-linear-gradient(#ffffff 0 5px,#bfe6ff 5px 12px);animation:fall .45s linear infinite}
  @keyframes fall{to{transform:translateY(12px)}}
  .ot-pool{position:absolute;top:108px;left:26px;width:42px;height:12px;border-radius:50%;
    background:radial-gradient(#cdeeff,#9fd6f5);animation:ripple 2.4s ease-in-out infinite}
  @keyframes ripple{50%{transform:scaleX(1.18)}}
  /* meadow */
  .ot-grass{position:absolute;left:0;right:0;bottom:0;height:46px;background:#7cc47f;
    border-top:3px solid #5fae6a;
    background-image:repeating-linear-gradient(90deg,transparent 0 8px,rgba(95,174,106,.5) 8px 9px)}
  .ot-grass::before{content:"";position:absolute;top:-6px;left:0;right:0;height:8px;
    background:repeating-linear-gradient(90deg,#5fae6a 0 3px,transparent 3px 12px)}
  /* pixel pine trees */
  .tree{position:absolute;bottom:34px;width:26px;height:32px;background:#2f8f43;
    clip-path:polygon(50% 0,66% 24%,57% 24%,76% 50%,63% 50%,86% 80%,14% 80%,37% 50%,24% 50%,34% 24%,25% 24%)}
  .tree::after{content:"";position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
    width:5px;height:8px;background:#6d4321}
  .tree.t2{transform:scale(.8);filter:brightness(.92)}
  .tree.t3{transform:scale(1.15);filter:brightness(1.05)}
  .tree.sakura{background:#f7a8c4}
  /* title chip */
  .ot-title{position:absolute;top:10px;left:12px;font-family:"Press Start 2P",monospace;
    font-size:11px;color:#1f3a26;text-shadow:1px 1px 0 #fff;letter-spacing:1px}
  /* stats panel */
  .ot-panel{background:#12241a;padding:14px}
  .ot-tabs{display:flex;gap:8px;margin-bottom:12px}
  .ot-tab{flex:1;background:#23402f;color:#bfe9c4;border-radius:10px;padding:9px;
    font-size:13px;font-weight:600}
  .ot-tab.on{background:#3fae5a;color:#082011}
  .ot-stat{display:flex;align-items:baseline;justify-content:space-between;
    padding:8px 0;border-top:1px solid #21402d}
  .ot-stat:first-of-type{border-top:0}
  .ot-k{color:#8fc79b;font-size:13px}
  .ot-v{font-family:"Press Start 2P",monospace;font-size:14px;color:#eafff0}
  .ot-money .ot-v{color:#ffd45e;font-size:13px}
  .ot-sub{margin-top:8px;color:#6fae80;font-size:12px;text-align:right}
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
    <div class="card ot" id="otCard" style="display:none">
      <div class="ot-scene">
        <div class="ot-cloud c1"></div>
        <div class="ot-cloud c2"></div>
        <div class="ot-sun"></div>
        <div class="ot-fuji"></div>
        <div class="ot-cliff"></div>
        <div class="ot-fall"></div>
        <div class="ot-pool"></div>
        <div class="tree t2" style="left:78px"></div>
        <div class="tree sakura" style="left:104px;bottom:36px"></div>
        <div class="tree" style="left:140px"></div>
        <div class="tree t3" style="left:172px"></div>
        <div class="tree t2" style="left:210px"></div>
        <div class="tree" style="left:246px"></div>
        <div class="ot-grass"></div>
        <div class="ot-title">&#9962; GIO OT</div>
      </div>
      <div class="ot-panel">
        <div class="ot-tabs">
          <button class="ot-tab on" id="otTabMonth">Tháng này</button>
          <button class="ot-tab" id="otTabAll">Tất cả (all-time)</button>
        </div>
        <div class="ot-stat"><span class="ot-k">Số giờ thực</span><span class="ot-v" id="otRaw">—</span></div>
        <div class="ot-stat"><span class="ot-k">Đã ×hệ số</span><span class="ot-v" id="otMult">—</span></div>
        <div class="ot-stat ot-money"><span class="ot-k">Thực nhận</span><span class="ot-v" id="otMoney">—</span></div>
        <div class="ot-sub" id="otSub"></div>
      </div>
    </div>
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
