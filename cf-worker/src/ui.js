// Single-page mobile/desktop UI served at "/". Japanese night pixel-art theme.
// Client JS avoids template literals/${} so it can live safely inside this template.
export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0f1f">
<title>Shift Auto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0a0f1f;--card:rgba(17,25,48,.74);--card2:rgba(38,50,86,.7);
    --txt:#e9eefb;--muted:#9fb0d6;--line:rgba(130,150,200,.22);
    --accent:#7fd0ff;--gold:#ffcf6b;--green:#52c97a;--red:#ef6b6b;--torii:#d2473b;--sakura:#f4b6d0;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;min-height:100%}
  body{background:var(--bg);color:var(--txt);overflow-x:hidden;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
  .px{font-family:"Press Start 2P",monospace}

  /* ===== Fixed night pixel scene (z0) ===== */
  .scene{position:fixed;inset:0;z-index:0;overflow:hidden;image-rendering:pixelated;
    background:linear-gradient(#070b18 0%,#0d1530 45%,#1b2750 78%,#26305a 100%)}
  .stars,.stars::after{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff}
  .stars{top:0;left:0;box-shadow:60px 40px #fff,140px 90px #cfe,220px 50px #fff,300px 120px #bce,
    380px 70px #fff,460px 30px #eef,540px 110px #fff,640px 60px #cdf,720px 100px #fff,820px 40px #fff,
    900px 90px #cce,1000px 60px #fff,1120px 110px #fff,1200px 50px #eef,80px 150px #fff,260px 170px #cdf,
    520px 160px #fff,760px 150px #fff,980px 170px #cce,1180px 140px #fff;animation:tw 4s ease-in-out infinite}
  .stars.s2{box-shadow:30px 70px #fff,180px 30px #cdf,360px 130px #fff,500px 80px #fff,680px 40px #cce,
    860px 120px #fff,1040px 80px #fff,1220px 100px #fff;animation-delay:2s;opacity:.7}
  @keyframes tw{50%{opacity:.45}}
  .moon{position:absolute;top:42px;right:8%;width:52px;height:52px;border-radius:50%;
    background:radial-gradient(circle at 38% 35%,#fdfbe9,#e8e3c4);box-shadow:0 0 34px 10px rgba(247,243,210,.28)}
  .fuji{position:absolute;bottom:140px;left:50%;transform:translateX(-55%);width:0;height:0;
    border-left:130px solid transparent;border-right:130px solid transparent;border-bottom:120px solid #1d2748;opacity:.9}
  .fuji::after{content:"";position:absolute;left:-34px;top:0;width:0;height:0;
    border-left:34px solid transparent;border-right:34px solid transparent;border-bottom:30px solid #d9e2ff;opacity:.85}
  /* torii */
  .torii{position:absolute;bottom:150px;left:9%;width:92px;height:104px;opacity:.96}
  .torii i{position:absolute;background:var(--torii);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
  .torii .top{top:0;left:-6px;width:104px;height:11px;border-radius:3px}
  .torii .top2{top:22px;left:4px;width:84px;height:9px}
  .torii .pl{top:8px;left:14px;width:11px;height:96px}
  .torii .pr{top:8px;right:14px;width:11px;height:96px}
  /* lantern string */
  .lstring{position:absolute;top:0;left:0;right:0;height:70px}
  .lstring .wire{position:absolute;top:14px;left:0;right:0;height:2px;background:rgba(255,255,255,.12)}
  .lantern{position:absolute;top:18px;width:20px;height:26px;border-radius:7px;background:#e8473a;
    box-shadow:0 0 14px 2px rgba(255,150,90,.55),inset 0 0 6px rgba(255,220,120,.7);
    transform-origin:top center;animation:sway 3.4s ease-in-out infinite}
  .lantern::before{content:"";position:absolute;top:-4px;left:6px;width:8px;height:4px;background:#7a2a22}
  .lantern::after{content:"";position:absolute;bottom:-4px;left:6px;width:8px;height:4px;background:#ffcf6b}
  @keyframes sway{50%{transform:rotate(7deg)}}
  /* trees on the ridge */
  .tree{position:absolute;bottom:104px;width:30px;height:38px;background:#16351f;
    clip-path:polygon(50% 0,66% 24%,57% 24%,76% 50%,63% 50%,86% 80%,14% 80%,37% 50%,24% 50%,34% 24%,25% 24%)}
  .tree::after{content:"";position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:5px;height:9px;background:#3a2614}
  .tree.sakura{background:#6e3a55}
  /* waterfall + koi pond */
  .cliff{position:absolute;bottom:96px;right:13%;width:46px;height:120px;background:#1a2238;border-radius:0 0 6px 6px}
  .fall{position:absolute;bottom:96px;right:15%;width:22px;height:118px;overflow:hidden;background:rgba(190,225,255,.5)}
  .fall::before{content:"";position:absolute;inset:-14px 0;
    background:repeating-linear-gradient(rgba(255,255,255,.85) 0 5px,rgba(150,200,255,.55) 5px 12px);animation:fall .5s linear infinite}
  @keyframes fall{to{transform:translateY(12px)}}
  .ground{position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(#16351f,#0e2415);
    border-top:3px solid #1f4a2b}
  .pond{position:absolute;bottom:34px;right:6%;width:200px;max-width:46vw;height:60px;border-radius:50%;
    background:radial-gradient(circle at 50% 40%,rgba(80,150,210,.55),rgba(20,60,110,.5));
    box-shadow:0 0 22px rgba(90,160,220,.25);overflow:hidden}
  .koi{position:absolute;top:50%;width:16px;height:7px;border-radius:50%;background:#ff8a3d;box-shadow:0 0 6px rgba(255,140,60,.6)}
  .koi.k1{animation:swim1 7s ease-in-out infinite}
  .koi.k2{background:#ffd0a0;top:62%;animation:swim2 9s ease-in-out infinite}
  .koi.k3{background:#ff6f4d;top:38%;animation:swim1 11s ease-in-out infinite reverse}
  @keyframes swim1{0%{left:-20px}50%{left:90%;transform:scaleX(-1)}100%{left:-20px}}
  @keyframes swim2{0%{left:100%;transform:scaleX(-1)}50%{left:0}100%{left:100%;transform:scaleX(-1)}}
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
<div class="scene">
  <div class="stars"></div><div class="stars s2"></div>
  <div class="moon"></div>
  <div class="fuji"></div>
  <div class="torii"><i class="top"></i><i class="top2"></i><i class="pl"></i><i class="pr"></i></div>
  <div class="lstring"><div class="wire"></div>
    <div class="lantern" style="left:18%"></div><div class="lantern" style="left:34%;animation-delay:.6s"></div>
    <div class="lantern" style="left:52%;animation-delay:1.1s"></div><div class="lantern" style="left:70%;animation-delay:.3s"></div>
    <div class="lantern" style="left:86%;animation-delay:.9s"></div>
  </div>
  <div class="tree" style="left:24%"></div>
  <div class="tree sakura" style="left:33%;bottom:106px"></div>
  <div class="tree" style="left:60%"></div>
  <div class="tree sakura" style="left:70%;bottom:108px"></div>
  <div class="cliff"></div><div class="fall"></div>
  <div class="ground"></div>
  <div class="pond"><div class="koi k1"></div><div class="koi k2"></div><div class="koi k3"></div></div>
</div>
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
