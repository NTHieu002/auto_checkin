// Single-page mobile+desktop UI served at "/". Japanese night theme, refined.
// Design discipline (per taste skill): ONE dark theme, ONE accent (lantern amber)
// + semantic state colors only, ONE radius scale, glass cards done right, zero
// em-dashes, Be Vietnam Pro (Vietnamese-native, not Inter), WCAG-AA contrast,
// reduced-motion honored. Client JS avoids template literals/${} (CSS may use ${}
// since renderHTML is server-side).
export function renderHTML() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0e1f">
<title>Shift Auto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0a0e1f;            /* off-black indigo */
    --bg2:#0e1530;
    --card:rgba(20,28,56,.62);
    --card-solid:#141c38;
    --line:rgba(150,170,225,.15);
    --line2:rgba(150,170,225,.10);
    --txt:#eaf0ff;
    --muted:#9aa8cf;
    --faint:#6b7aa6;
    --accent:#f4b860;        /* lantern amber - the ONE decorative accent */
    --accent-soft:rgba(244,184,96,.16);
    --ink:#2a1b06;           /* dark text for on-amber */
    --ok:#74d39a;            /* semantic: completed */
    --live:#f4b860;          /* semantic: in-shift (reuses amber) */
    --danger:#ef8080;
    --sakura:#f1b6cf;
    --r-card:16px; --r-btn:12px; --r-pill:999px;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;min-height:100%}
  body{background:var(--bg);color:var(--txt);overflow-x:hidden;
    font-family:"Be Vietnam Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
  .num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}

  /* ===== Night scene (fixed, z0) ===== */
  .scene{position:fixed;inset:0;z-index:0;overflow:hidden;
    background:
      radial-gradient(120% 80% at 82% -10%,rgba(244,184,96,.10),transparent 42%),
      radial-gradient(90% 70% at 50% 120%,rgba(60,90,170,.20),transparent 60%),
      linear-gradient(180deg,#070b1b 0%,#0a1026 46%,#101a3c 78%,#142048 100%)}
  .stars{position:absolute;top:0;left:0;width:2px;height:2px;border-radius:50%;background:#fff;
    box-shadow:60px 50px rgba(255,255,255,.9),150px 96px rgba(205,222,255,.7),250px 40px #fff,
      330px 130px rgba(190,210,255,.7),430px 76px #fff,520px 30px rgba(230,238,255,.8),
      620px 116px rgba(255,255,255,.7),740px 60px rgba(205,225,255,.7),860px 100px #fff,
      980px 44px rgba(255,255,255,.8),1080px 92px rgba(205,222,255,.6),1180px 58px #fff,
      90px 160px rgba(255,255,255,.6),300px 180px rgba(205,225,255,.6),560px 168px #fff,
      820px 176px rgba(255,255,255,.6),1040px 150px rgba(205,222,255,.6);
    animation:tw 5s ease-in-out infinite}
  .stars.b{box-shadow:200px 70px #fff,470px 120px rgba(220,232,255,.7),700px 40px #fff,
      940px 110px rgba(205,222,255,.6),1140px 86px #fff;animation-delay:2.5s;opacity:.7}
  @keyframes tw{50%{opacity:.5}}
  .moon{position:absolute;top:6vh;right:9%;width:58px;height:58px;border-radius:50%;
    background:radial-gradient(circle at 38% 34%,#fdfaec,#e7e1c6);
    box-shadow:0 0 44px 12px rgba(248,243,214,.22)}
  .fuji{position:absolute;bottom:9vh;left:50%;transform:translateX(-52%);width:0;height:0;
    border-left:150px solid transparent;border-right:150px solid transparent;
    border-bottom:128px solid #141d40;opacity:.85}
  .fuji::after{content:"";position:absolute;left:-38px;top:0;width:0;height:0;
    border-left:38px solid transparent;border-right:38px solid transparent;
    border-bottom:30px solid rgba(220,230,255,.7)}
  .torii{position:absolute;bottom:9vh;left:11%;width:78px;height:92px;opacity:.55}
  .torii i{position:absolute;background:#7c2f2a}
  .torii .t1{top:0;left:-7px;width:92px;height:9px;border-radius:3px 3px 0 0}
  .torii .t2{top:20px;left:5px;width:68px;height:7px}
  .torii .p1{top:7px;left:12px;width:9px;height:85px}
  .torii .p2{top:7px;right:12px;width:9px;height:85px}
  .hills{position:absolute;left:0;right:0;bottom:0;height:9vh;min-height:64px;
    background:linear-gradient(180deg,#0e1838,#0a1026);
    border-top:1px solid rgba(150,170,225,.08)}
  .tree{position:absolute;bottom:8vh;width:26px;height:34px;background:#101a3a;opacity:.8;
    clip-path:polygon(50% 0,66% 26%,57% 26%,76% 52%,63% 52%,86% 82%,14% 82%,37% 52%,24% 52%,34% 26%,25% 26%)}
  /* hanging lanterns */
  .lwire{position:absolute;top:0;left:0;right:0;height:2px;background:rgba(244,184,96,.16)}
  .lantern{position:absolute;top:0;width:18px;height:24px;border-radius:6px;
    background:linear-gradient(#f0a93f,#d9762e);
    box-shadow:0 0 16px 3px rgba(244,170,80,.45),inset 0 0 6px rgba(255,224,150,.6);
    transform-origin:top center;animation:sway 4s ease-in-out infinite}
  .lantern::before{content:"";position:absolute;top:-3px;left:6px;width:6px;height:3px;background:#5a3411}
  .lantern::after{content:"";position:absolute;bottom:-3px;left:6px;width:6px;height:3px;background:#ffd98a}
  @keyframes sway{50%{transform:rotate(6deg)}}
  /* still pond glow + slow koi (subtle nod, low motion) */
  .pond{position:absolute;bottom:2.4vh;right:8%;width:34vw;max-width:230px;height:54px;border-radius:50%;
    background:radial-gradient(circle at 50% 38%,rgba(90,140,210,.34),rgba(30,60,120,.22));overflow:hidden}
  .koi{position:absolute;top:48%;width:14px;height:6px;border-radius:50%;background:#f0833c;opacity:.85}
  .koi.a{animation:koi 13s ease-in-out infinite}
  .koi.b{top:64%;background:#f6b07a;animation:koi 17s ease-in-out infinite reverse}
  @keyframes koi{0%{left:-16px}50%{left:90%;transform:scaleX(-1)}100%{left:-16px}}
  /* sakura petals */
  .petals{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .petal{position:absolute;top:-18px;width:9px;height:9px;background:var(--sakura);
    border-radius:9px 1px 9px 1px;opacity:.8;animation:fallp linear infinite}
  @keyframes fallp{0%{transform:translateY(-20px) translateX(0) rotate(0)}
    100%{transform:translateY(104vh) translateX(56px) rotate(400deg)}}

  /* ===== Content ===== */
  .wrap{position:relative;z-index:2;max-width:980px;margin:0 auto;padding:22px 16px 44px}
  .hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
  .brand{display:flex;align-items:center;gap:10px}
  .mark{width:34px;height:34px;border-radius:10px;flex:0 0 auto;
    background:radial-gradient(circle at 40% 34%,#f6c878,#dd882f);
    box-shadow:0 0 18px rgba(244,170,80,.4),inset 0 1px 0 rgba(255,255,255,.4)}
  .logo{font-size:18px;font-weight:800;letter-spacing:.2px}
  .logo b{color:var(--accent)}
  .sub{color:var(--muted);font-size:13px;margin-top:3px}
  .ghostbtn{background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--txt);
    border-radius:var(--r-pill);padding:8px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
    transition:background .15s,transform .05s}
  .ghostbtn:active{transform:translateY(1px)}
  .sect{font-size:12px;color:var(--faint);margin:20px 2px 10px;letter-spacing:.14em;
    text-transform:uppercase;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr;gap:16px}
  @media(min-width:820px){.grid{grid-template-columns:1.08fr .92fr;align-items:start}}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:16px;
    backdrop-filter:blur(14px) saturate(135%);-webkit-backdrop-filter:blur(14px) saturate(135%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 12px 34px rgba(4,8,22,.45)}
  .card + .card{margin-top:14px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .slot{font-size:24px;font-weight:800;letter-spacing:.3px}
  .role{color:var(--muted);font-size:13px;margin-top:2px}
  .badge{font-size:12px;font-weight:700;padding:5px 11px;border-radius:var(--r-pill);white-space:nowrap;
    border:1px solid transparent}
  .b-none{background:rgba(150,170,225,.12);color:#c4d0f0;border-color:var(--line)}
  .b-open{background:var(--accent-soft);color:var(--accent);border-color:rgba(244,184,96,.32)}
  .b-closed{background:rgba(116,211,154,.14);color:var(--ok);border-color:rgba(116,211,154,.3)}
  .times{margin-top:12px;font-size:13px;color:var(--muted);line-height:1.6;
    border-top:1px solid var(--line2);padding-top:10px}
  .times b{color:var(--txt);font-weight:600}
  .btns{display:flex;gap:10px;margin-top:14px}
  button.act{font:inherit;font-weight:700;border-radius:var(--r-btn);padding:12px;flex:1;cursor:pointer;
    border:1px solid transparent;transition:transform .05s,opacity .15s,background .15s}
  button.act:active{transform:translateY(1px)}
  button.act:disabled{opacity:.32;cursor:default}
  .bi{background:var(--accent);color:var(--ink);box-shadow:0 6px 18px rgba(244,170,80,.28)}
  .bo{background:transparent;color:var(--accent);border-color:rgba(244,184,96,.5)}
  .switch{display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:13px 0;border-top:1px solid var(--line2)}
  .switch:first-child{border-top:0}
  .switch .lbl{font-weight:600}
  .switch .hint{color:var(--muted);font-size:12.5px;margin-top:2px}
  .toggle{width:50px;height:30px;border-radius:var(--r-pill);background:rgba(150,170,225,.22);
    position:relative;flex:0 0 auto;transition:background .2s;cursor:pointer}
  .toggle.on{background:var(--accent)}
  .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;
    transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
  .toggle.on .knob{left:23px}

  /* OT block */
  .ot-name{font-weight:800;font-size:15px;color:var(--accent)}
  .ot-tabs{display:flex;gap:8px;margin:14px 0 6px;background:rgba(8,12,28,.5);padding:4px;border-radius:12px}
  .ot-tab{flex:1;background:transparent;color:var(--muted);border-radius:9px;padding:9px;
    font:inherit;font-size:13px;font-weight:700;cursor:pointer;border:0;transition:background .15s,color .15s}
  .ot-tab.on{background:var(--accent);color:var(--ink)}
  .ot-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .ot-cell{background:rgba(8,12,28,.4);border:1px solid var(--line2);border-radius:12px;padding:12px}
  .ot-cell.full{grid-column:1 / -1;background:var(--accent-soft);border-color:rgba(244,184,96,.3)}
  .ot-k{color:var(--muted);font-size:12px;font-weight:600}
  .ot-v{font-size:22px;font-weight:800;margin-top:4px;letter-spacing:.3px}
  .ot-cell.full .ot-v{color:var(--accent)}
  .ot-u{font-size:13px;color:var(--faint);font-weight:600}
  .ot-sub{margin-top:12px;color:var(--faint);font-size:12px}

  /* PIN gate */
  .gatewrap{max-width:380px;margin:9vh auto 0}
  .gate-h{text-align:center;margin-bottom:18px}
  .gate-h .logo{font-size:24px}
  input{width:100%;padding:15px;border-radius:var(--r-btn);border:1px solid var(--line);
    background:rgba(8,12,28,.6);color:var(--txt);font:inherit;font-size:20px;text-align:center;letter-spacing:8px}
  input::placeholder{color:var(--faint);letter-spacing:8px}
  input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}

  .foot{text-align:center;margin-top:20px}
  .linkbtn{background:none;border:0;color:var(--muted);font:inherit;font-size:13px;cursor:pointer;padding:6px}
  .linkbtn:hover{color:var(--txt)}

  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0c1330;
    border:1px solid var(--line);padding:11px 16px;border-radius:12px;font-size:14px;max-width:90%;
    opacity:0;transition:opacity .2s;pointer-events:none;z-index:40;box-shadow:0 10px 30px rgba(0,0,0,.4)}
  .toast.show{opacity:1}
  .toast.err{border-color:var(--danger);color:#fecdcd}
  .empty{text-align:center;color:var(--muted);padding:6px}

  @media (prefers-reduced-transparency: reduce){
    .card{background:var(--card-solid);backdrop-filter:none;-webkit-backdrop-filter:none}
  }
  @media (prefers-reduced-motion: reduce){
    .stars,.lantern,.koi,.petal{animation:none!important}
    .petals{display:none}
  }
</style>
</head>
<body>
<div class="scene">
  <div class="stars"></div><div class="stars b"></div>
  <div class="moon"></div>
  <div class="fuji"></div>
  <div class="torii"><i class="t1"></i><i class="t2"></i><i class="p1"></i><i class="p2"></i></div>
  <div class="lwire"></div>
  <div class="lantern" style="left:20%;top:10px"></div>
  <div class="lantern" style="left:46%;top:6px;animation-delay:.8s"></div>
  <div class="lantern" style="left:73%;top:12px;animation-delay:1.6s"></div>
  <div class="tree" style="left:26%"></div>
  <div class="tree" style="left:62%;transform:scale(.82)"></div>
  <div class="tree" style="left:70%"></div>
  <div class="hills"></div>
  <div class="pond"><div class="koi a"></div><div class="koi b"></div></div>
</div>
<div class="petals">
  <span class="petal" style="left:8%;animation-duration:10s"></span>
  <span class="petal" style="left:22%;animation-duration:13s;animation-delay:3s"></span>
  <span class="petal" style="left:38%;animation-duration:11s;animation-delay:6s"></span>
  <span class="petal" style="left:55%;animation-duration:9s;animation-delay:2s"></span>
  <span class="petal" style="left:72%;animation-duration:12s;animation-delay:4.5s"></span>
  <span class="petal" style="left:88%;animation-duration:14s;animation-delay:1s"></span>
</div>

<div class="wrap">
  <!-- PIN gate -->
  <div id="gate" style="display:none">
    <div class="gatewrap">
      <div class="gate-h">
        <div class="brand" style="justify-content:center">
          <span class="mark"></span><span class="logo">Shift<b>Auto</b></span>
        </div>
        <p class="sub" style="margin-top:12px">Nhập mã PIN để tiếp tục</p>
      </div>
      <div class="card">
        <input id="pin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off">
        <div class="btns"><button class="act bi" id="pinBtn">Mở khoá</button></div>
      </div>
    </div>
  </div>

  <!-- App -->
  <div id="app" style="display:none">
    <div class="hd">
      <div class="brand">
        <span class="mark"></span>
        <div><div class="logo">Shift<b>Auto</b></div><div class="sub num" id="dateline">…</div></div>
      </div>
      <button class="ghostbtn" id="refreshBtn">↻ Tải lại</button>
    </div>

    <div class="grid">
      <div class="col">
        <div class="sect">Ca hôm nay</div>
        <div id="shifts"></div>
        <div class="sect">Tự động</div>
        <div class="card">
          <div class="switch">
            <div><div class="lbl">Tự động check-in/out</div>
              <div class="hint">Chạy trên cloud theo giờ ca</div></div>
            <div class="toggle" id="tgAuto"><div class="knob"></div></div>
          </div>
          <div class="switch">
            <div><div class="lbl">Bỏ qua hôm nay</div>
              <div class="hint">Không tự động trong hôm nay</div></div>
            <div class="toggle" id="tgSkip"><div class="knob"></div></div>
          </div>
          <div class="switch">
            <div><div class="lbl">Báo Slack</div>
              <div class="hint">Gửi thông báo khi check-in/out</div></div>
            <div class="toggle" id="tgSlack"><div class="knob"></div></div>
          </div>
        </div>
      </div>

      <div class="col">
        <div class="sect">Thống kê OT</div>
        <div class="card" id="otCard" style="display:none">
          <div class="ot-name">Giờ OT của tôi</div>
          <div class="ot-tabs">
            <button class="ot-tab on" id="otTabMonth">Tháng này</button>
            <button class="ot-tab" id="otTabAll">Tất cả</button>
          </div>
          <div class="ot-grid">
            <div class="ot-cell"><div class="ot-k">Giờ thực</div><div class="ot-v num" id="otRaw">-</div></div>
            <div class="ot-cell"><div class="ot-k">Đã ×hệ số</div><div class="ot-v num" id="otMult">-</div></div>
            <div class="ot-cell full"><div class="ot-k">Thực nhận</div><div class="ot-v num" id="otMoney">-</div></div>
          </div>
          <div class="ot-sub num" id="otSub"></div>
        </div>
      </div>
    </div>

    <div class="foot"><button class="linkbtn" id="logoutBtn">Đăng xuất</button></div>
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
    if(state === "open") return '<span class="badge b-open">Đang trong ca</span>';
    if(state === "closed") return '<span class="badge b-closed">Đã xong</span>';
    return '<span class="badge b-none">Chưa check-in</span>';
  }
  function fmt(iso){
    if(!iso) return "-";
    var d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Ho_Chi_Minh" });
  }

  function render(data){
    $("dateline").textContent = data.date + "  ·  " + data.now;
    var box = $("shifts");
    if(!data.assignments.length){
      box.innerHTML = '<div class="card empty">Không có ca nào hôm nay 🌙</div>';
    } else {
      box.innerHTML = data.assignments.map(function(a){
        var canIn = a.state === "none";
        var canOut = a.state === "open";
        return '<div class="card">'
          + '<div class="row"><div><div class="slot num">' + a.shift_slot + '</div>'
          + '<div class="role">Vai trò: ' + (a.role || (a.is_sl ? "SL" : "FL/TS")) + '</div></div>'
          + badge(a.state) + '</div>'
          + '<div class="times num">Vào: <b>' + fmt(a.checkin_time) + '</b> &nbsp; Ra: <b>' + fmt(a.checkout_time) + '</b></div>'
          + '<div class="btns">'
          + '<button class="act bi" ' + (canIn?"":"disabled") + ' onclick="act(\\'checkin\\',\\'' + a.id + '\\')">Check in</button>'
          + '<button class="act bo" ' + (canOut?"":"disabled") + ' onclick="act(\\'checkout\\',\\'' + a.id + '\\')">Check out</button>'
          + '</div></div>';
      }).join("");
    }
    renderOt(data.ot);
    setToggle($("tgAuto"), data.config.autoEnabled);
    setToggle($("tgSkip"), data.config.skipToday);
    setToggle($("tgSlack"), data.config.slackNotify);
  }
  function setToggle(el, on){ el.className = "toggle" + (on ? " on" : ""); }

  function fmtH(h){ return (Math.round(h * 10) / 10); }
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
    $("otRaw").innerHTML = fmtH(d.rawHours) + '<span class="ot-u">h</span>';
    $("otMult").innerHTML = fmtH(d.multHours) + '<span class="ot-u">h</span>';
    $("otMoney").textContent = fmtMoney(d.money);
    $("otSub").textContent = (d.count || 0) + " ca OT "
      + (otView === "all" ? "toàn bộ" : "tháng " + OT.thisMonth)
      + "  ·  đơn giá " + fmtMoney(OT.rate) + "/h";
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
      else toast(action === "checkin" ? "Đã check-in" : "Đã check-out");
      load();
    }).catch(function(e){ toast(e.message, true); }).finally(function(){ busy = false; });
  };

  function bindToggle(id, key, onMsg, offMsg){
    $(id).onclick = function(){
      var on = !this.classList.contains("on");
      setToggle(this, on);
      var body = {}; body[key] = on;
      api("config", body).then(function(r){
        toast(r.config[key] ? onMsg : offMsg);
      }).catch(function(e){ toast(e.message, true); load(); });
    };
  }
  bindToggle("tgAuto", "autoEnabled", "Đã bật tự động", "Đã tắt tự động");
  bindToggle("tgSlack", "slackNotify", "Đã bật báo Slack", "Đã tắt báo Slack");
  $("tgSkip").onclick = function(){
    var on = !this.classList.contains("on");
    setToggle(this, on);
    api("config", { skipToday: on }).then(function(r){
      toast(r.config.skipToday ? "Hôm nay sẽ không tự động" : "Hôm nay tự động bình thường");
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
