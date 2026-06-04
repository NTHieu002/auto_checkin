// Single-page mobile+desktop UI served at "/". Japanese night theme, layered + animated.
// Palette: deep navy/charcoal + warm gold accent + jade-green highlight. Layered parallax
// scene (mountains, pagoda, torii, lanterns), floating petals + fireflies, glass cards with
// glow, animated buttons/toggles. Discipline kept: one dark theme, locked radius scale,
// glass done right, zero em-dashes, Be Vietnam Pro (Vietnamese-native), WCAG-AA contrast,
// reduced-motion / reduced-transparency fallbacks. Client JS avoids template literals/${}.
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
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#080b18; --bg2:#0c1228;
    --card:rgba(18,26,52,.6); --card-solid:#121a34;
    --line:rgba(150,172,228,.15); --line2:rgba(150,172,228,.09);
    --txt:#eaf0ff; --muted:#9aa8cf; --faint:#6b7aa6;
    --gold:#f4b860; --gold-soft:rgba(244,184,96,.16); --ink:#2a1b06;   /* primary accent */
    --jade:#48c9a6; --jade-soft:rgba(72,201,166,.15);                  /* highlight */
    --danger:#ef8080; --sakura:#f1b6cf;
    --r-card:18px; --r-btn:12px; --r-pill:999px;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;min-height:100%}
  body{background:var(--bg);color:var(--txt);overflow-x:hidden;
    font-family:"Be Vietnam Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
  .num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}

  /* ===== Layered night scene (fixed, z0) ===== */
  .scene{position:fixed;inset:0;z-index:0;overflow:hidden;
    background:
      radial-gradient(130% 84% at 84% -12%,rgba(244,184,96,.10),transparent 44%),
      radial-gradient(96% 70% at 50% 122%,rgba(56,96,180,.20),transparent 60%),
      linear-gradient(180deg,#05070f 0%,#080d22 44%,#0e1838 78%,#122046 100%)}
  .layer{position:absolute;inset:0;will-change:transform}
  .stars{position:absolute;top:0;left:0;width:2px;height:2px;border-radius:50%;background:#fff;
    box-shadow:60px 50px rgba(255,255,255,.9),150px 96px rgba(205,222,255,.7),250px 40px #fff,
      330px 130px rgba(190,210,255,.7),430px 76px #fff,520px 30px rgba(230,238,255,.8),
      620px 116px rgba(255,255,255,.7),740px 60px rgba(205,225,255,.7),860px 100px #fff,
      980px 44px rgba(255,255,255,.8),1080px 92px rgba(205,222,255,.6),1180px 58px #fff,
      90px 160px rgba(255,255,255,.6),300px 180px rgba(205,225,255,.6),560px 168px #fff,
      820px 176px rgba(255,255,255,.6),1040px 150px rgba(205,222,255,.6),1260px 80px #fff;
    animation:tw 5s ease-in-out infinite}
  .stars.b{box-shadow:200px 70px #fff,470px 120px rgba(220,232,255,.7),700px 40px #fff,
      940px 110px rgba(205,222,255,.6),1140px 86px #fff,1320px 130px #fff;animation-delay:2.5s;opacity:.7}
  @keyframes tw{50%{opacity:.5}}
  .moon{position:absolute;top:6vh;right:9%;width:60px;height:60px;border-radius:50%;
    background:radial-gradient(circle at 38% 34%,#fdfaec,#e7e1c6);
    box-shadow:0 0 48px 14px rgba(248,243,214,.22)}
  .mtns{position:absolute;left:-6%;right:-6%;bottom:8.5vh;height:140px;background:#0c1430;opacity:.8;
    clip-path:polygon(0 100%,0 64%,10% 38%,18% 58%,28% 26%,38% 52%,50% 22%,60% 50%,72% 30%,82% 56%,92% 36%,100% 58%,100% 100%)}
  .fuji{position:absolute;bottom:8.5vh;left:50%;transform:translateX(-52%);width:0;height:0;
    border-left:158px solid transparent;border-right:158px solid transparent;
    border-bottom:132px solid #111a3e;opacity:.92}
  .fuji::after{content:"";position:absolute;left:-40px;top:0;width:0;height:0;
    border-left:40px solid transparent;border-right:40px solid transparent;
    border-bottom:31px solid rgba(220,230,255,.72)}
  /* pagoda silhouette */
  .pagoda{position:absolute;bottom:8.5vh;left:73%;width:58px;height:90px;opacity:.5}
  .pagoda span{position:absolute;left:50%;transform:translateX(-50%);background:#0c1430}
  .pagoda .r1{top:0;width:30px;height:10px;clip-path:polygon(0 100%,18% 0,82% 0,100% 100%)}
  .pagoda .r2{top:25px;width:44px;height:11px;clip-path:polygon(0 100%,15% 0,85% 0,100% 100%)}
  .pagoda .r3{top:52px;width:58px;height:12px;clip-path:polygon(0 100%,13% 0,87% 0,100% 100%)}
  .pagoda .b1{top:9px;width:9px;height:17px}.pagoda .b2{top:35px;width:13px;height:18px}
  .pagoda .b3{top:63px;width:18px;height:27px}
  .pagoda .top{top:-7px;width:3px;height:8px;background:var(--gold);opacity:.7}
  /* torii */
  .torii{position:absolute;bottom:8.5vh;left:12%;width:76px;height:90px;opacity:.62}
  .torii i{position:absolute;background:#8a322b}
  .torii .t1{top:0;left:-7px;width:90px;height:9px;border-radius:3px 3px 0 0}
  .torii .t2{top:20px;left:5px;width:66px;height:7px}
  .torii .p1{top:7px;left:12px;width:9px;height:83px}.torii .p2{top:7px;right:12px;width:9px;height:83px}
  .hills{position:absolute;left:0;right:0;bottom:0;height:8.5vh;min-height:60px;
    background:linear-gradient(180deg,#0c1736,#070d22);border-top:1px solid rgba(150,172,228,.08)}
  .tree{position:absolute;bottom:7.6vh;width:26px;height:34px;background:#0d1734;opacity:.85;
    clip-path:polygon(50% 0,66% 26%,57% 26%,76% 52%,63% 52%,86% 82%,14% 82%,37% 52%,24% 52%,34% 26%,25% 26%)}
  .lwire{position:absolute;top:0;left:0;right:0;height:2px;background:rgba(244,184,96,.16)}
  .lantern{position:absolute;top:0;width:18px;height:24px;border-radius:6px;
    background:linear-gradient(#f0a93f,#d9762e);
    box-shadow:0 0 16px 3px rgba(244,170,80,.45),inset 0 0 6px rgba(255,224,150,.6);
    transform-origin:top center;animation:sway 4s ease-in-out infinite}
  .lantern::before{content:"";position:absolute;top:-3px;left:6px;width:6px;height:3px;background:#5a3411}
  .lantern::after{content:"";position:absolute;bottom:-3px;left:6px;width:6px;height:3px;background:#ffd98a}
  @keyframes sway{50%{transform:rotate(6deg)}}
  .pond{position:absolute;bottom:2.2vh;right:8%;width:34vw;max-width:230px;height:52px;border-radius:50%;
    background:radial-gradient(circle at 50% 38%,rgba(72,201,166,.22),rgba(30,70,120,.2));overflow:hidden}
  .koi{position:absolute;top:48%;width:14px;height:6px;border-radius:50%;background:#f0833c;opacity:.85}
  .koi.a{animation:koi 13s ease-in-out infinite}
  .koi.b{top:64%;background:#f6b07a;animation:koi 17s ease-in-out infinite reverse}
  @keyframes koi{0%{left:-16px}50%{left:90%;transform:scaleX(-1)}100%{left:-16px}}
  /* floating particles */
  .fx{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
  .petal{position:absolute;top:-18px;width:9px;height:9px;background:var(--sakura);
    border-radius:9px 1px 9px 1px;opacity:.8;animation:fallp linear infinite}
  @keyframes fallp{0%{transform:translateY(-20px) translateX(0) rotate(0)}
    100%{transform:translateY(106vh) translateX(58px) rotate(400deg)}}
  .fly{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffe1a0;
    box-shadow:0 0 9px 2px rgba(255,205,120,.7);opacity:.6;animation:fly ease-in-out infinite}
  @keyframes fly{0%,100%{transform:translate(0,0);opacity:.25}
    25%{transform:translate(16px,-22px);opacity:.7}50%{transform:translate(-12px,-38px);opacity:.5}
    75%{transform:translate(10px,-18px);opacity:.7}}

  /* ===== Content ===== */
  .wrap{position:relative;z-index:2;max-width:980px;margin:0 auto;padding:24px 16px 48px}
  .hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
  .brand{display:flex;align-items:center;gap:11px}
  .mark{width:36px;height:36px;border-radius:11px;flex:0 0 auto;
    background:radial-gradient(circle at 38% 32%,#f6c878,#dd882f);
    box-shadow:0 0 20px rgba(244,170,80,.42),inset 0 1px 0 rgba(255,255,255,.45)}
  .logo{font-size:19px;font-weight:800;letter-spacing:.3px}
  .logo b{color:var(--gold)}
  .sub{color:var(--muted);font-size:13px;margin-top:3px;letter-spacing:.2px}
  .ghostbtn{background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--txt);
    border-radius:var(--r-pill);padding:9px 15px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
    transition:background .15s,transform .05s,border-color .15s}
  .ghostbtn:hover{border-color:rgba(72,201,166,.4)}
  .ghostbtn:active{transform:translateY(1px)}
  .sect{font-size:12px;color:var(--faint);margin:22px 2px 11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr;gap:16px}
  @media(min-width:820px){.grid{grid-template-columns:1.08fr .92fr;align-items:start}}
  .card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:17px;
    backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 14px 38px rgba(3,6,18,.5);
    transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s,border-color .22s}
  .card + .card{margin-top:14px}
  @media(hover:hover){.card:hover{transform:translateY(-2px);border-color:rgba(150,172,228,.28)}}
  .reveal{animation:rise .5s both cubic-bezier(.2,.8,.2,1)}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .card.glow{border-color:rgba(244,184,96,.42);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1px rgba(244,184,96,.22),0 0 30px rgba(244,170,80,.2),0 14px 38px rgba(3,6,18,.5)}
  .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .slot{font-size:25px;font-weight:800;letter-spacing:.4px}
  .role{color:var(--muted);font-size:13px;margin-top:2px}
  .badge{font-size:12px;font-weight:700;padding:5px 11px;border-radius:var(--r-pill);white-space:nowrap;border:1px solid transparent}
  .b-none{background:rgba(150,172,228,.12);color:#c4d0f0;border-color:var(--line)}
  .b-open{background:var(--gold-soft);color:var(--gold);border-color:rgba(244,184,96,.34)}
  .b-closed{background:var(--jade-soft);color:var(--jade);border-color:rgba(72,201,166,.32)}
  .times{margin-top:12px;font-size:13px;color:var(--muted);line-height:1.6;border-top:1px solid var(--line2);padding-top:11px}
  .times b{color:var(--txt);font-weight:600}
  .btns{display:flex;gap:10px;margin-top:15px}
  button.act{position:relative;overflow:hidden;font:inherit;font-weight:700;border-radius:var(--r-btn);padding:12px;flex:1;
    cursor:pointer;border:1px solid transparent;transition:transform .05s,opacity .15s,background .15s,box-shadow .2s}
  button.act:active{transform:translateY(1px)}
  button.act:disabled{opacity:.3;cursor:default}
  .bi{background:var(--gold);color:var(--ink);box-shadow:0 6px 20px rgba(244,170,80,.3)}
  .bi:not(:disabled)::after{content:"";position:absolute;top:0;left:-65%;width:42%;height:100%;
    background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);
    animation:shimmer 3.6s ease-in-out infinite}
  @keyframes shimmer{0%,62%{left:-65%}100%{left:150%}}
  .bo{background:transparent;color:var(--jade);border-color:rgba(72,201,166,.5)}
  .bo:not(:disabled):hover{background:var(--jade-soft)}
  .switch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-top:1px solid var(--line2)}
  .switch:first-child{border-top:0}
  .switch .lbl{font-weight:600}
  .switch .hint{color:var(--muted);font-size:12.5px;margin-top:2px}
  .toggle{width:50px;height:30px;border-radius:var(--r-pill);background:rgba(150,172,228,.22);position:relative;flex:0 0 auto;
    transition:background .2s,box-shadow .2s;cursor:pointer}
  .toggle.on{background:var(--gold);box-shadow:0 0 14px rgba(244,170,80,.45)}
  .knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;
    transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
  .toggle.on .knob{left:23px}

  .ot-name{font-weight:800;font-size:15px;color:var(--gold)}
  .ot-tabs{display:flex;gap:6px;margin:14px 0 4px;background:rgba(6,10,24,.55);padding:4px;border-radius:12px}
  .ot-tab{flex:1;background:transparent;color:var(--muted);border-radius:9px;padding:9px;font:inherit;font-size:13px;
    font-weight:700;cursor:pointer;border:0;transition:background .15s,color .15s}
  .ot-tab.on{background:var(--gold);color:var(--ink)}
  .ot-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .ot-cell{background:rgba(6,10,24,.42);border:1px solid var(--line2);border-radius:13px;padding:13px}
  .ot-cell.full{grid-column:1 / -1;background:var(--gold-soft);border-color:rgba(244,184,96,.3)}
  .ot-k{color:var(--muted);font-size:12px;font-weight:600}
  .ot-v{font-size:23px;font-weight:800;margin-top:4px;letter-spacing:.3px}
  .ot-cell:nth-child(2) .ot-v{color:var(--jade)}
  .ot-cell.full .ot-v{color:var(--gold)}
  .ot-u{font-size:13px;color:var(--faint);font-weight:600;margin-left:1px}
  .ot-sub{margin-top:13px;color:var(--faint);font-size:12px}

  .gatewrap{max-width:380px;margin:10vh auto 0}
  .gate-h{text-align:center;margin-bottom:18px}
  input{width:100%;padding:15px;border-radius:var(--r-btn);border:1px solid var(--line);background:rgba(6,10,24,.6);
    color:var(--txt);font:inherit;font-size:20px;text-align:center;letter-spacing:8px}
  input::placeholder{color:var(--faint);letter-spacing:8px}
  input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-soft)}

  .foot{text-align:center;margin-top:22px}
  .linkbtn{background:none;border:0;color:var(--muted);font:inherit;font-size:13px;cursor:pointer;padding:6px}
  .linkbtn:hover{color:var(--txt)}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0b1230;border:1px solid var(--line);
    padding:11px 16px;border-radius:12px;font-size:14px;max-width:90%;opacity:0;transition:opacity .2s;pointer-events:none;
    z-index:40;box-shadow:0 10px 30px rgba(0,0,0,.45)}
  .toast.show{opacity:1}
  .toast.err{border-color:var(--danger);color:#fecdcd}
  .empty{text-align:center;color:var(--muted);padding:8px}

  @media (prefers-reduced-transparency: reduce){.card{background:var(--card-solid);backdrop-filter:none;-webkit-backdrop-filter:none}}
  @media (prefers-reduced-motion: reduce){
    .stars,.lantern,.koi,.petal,.fly,.bi::after,.reveal{animation:none!important}
    .fx{display:none} .card{transition:none}
  }
</style>
</head>
<body>
<div class="scene">
  <div class="layer" data-depth="0.15">
    <div class="stars"></div><div class="stars b"></div><div class="moon"></div>
  </div>
  <div class="layer" data-depth="0.35">
    <div class="mtns"></div><div class="fuji"></div>
  </div>
  <div class="layer" data-depth="0.55">
    <div class="pagoda"><span class="top"></span><span class="r1"></span><span class="b1"></span>
      <span class="r2"></span><span class="b2"></span><span class="r3"></span><span class="b3"></span></div>
    <div class="torii"><i class="t1"></i><i class="t2"></i><i class="p1"></i><i class="p2"></i></div>
  </div>
  <div class="layer" data-depth="0.85">
    <div class="lwire"></div>
    <div class="lantern" style="left:20%;top:10px"></div>
    <div class="lantern" style="left:46%;top:6px;animation-delay:.8s"></div>
    <div class="lantern" style="left:74%;top:12px;animation-delay:1.6s"></div>
    <div class="tree" style="left:27%"></div>
    <div class="tree" style="left:63%;transform:scale(.82)"></div>
    <div class="tree" style="left:71%"></div>
    <div class="hills"></div>
    <div class="pond"><div class="koi a"></div><div class="koi b"></div></div>
  </div>
</div>
<div class="fx">
  <span class="petal" style="left:8%;animation-duration:10s"></span>
  <span class="petal" style="left:22%;animation-duration:13s;animation-delay:3s"></span>
  <span class="petal" style="left:38%;animation-duration:11s;animation-delay:6s"></span>
  <span class="petal" style="left:55%;animation-duration:9s;animation-delay:2s"></span>
  <span class="petal" style="left:72%;animation-duration:12s;animation-delay:4.5s"></span>
  <span class="petal" style="left:88%;animation-duration:14s;animation-delay:1s"></span>
  <span class="fly" style="left:30%;top:62%;animation-duration:15s"></span>
  <span class="fly" style="left:64%;top:70%;animation-duration:18s;animation-delay:3s"></span>
  <span class="fly" style="left:82%;top:58%;animation-duration:13s;animation-delay:6s"></span>
</div>

<div class="wrap">
  <div id="gate" style="display:none">
    <div class="gatewrap">
      <div class="gate-h">
        <div class="brand" style="justify-content:center"><span class="mark"></span><span class="logo">Shift<b>Auto</b></span></div>
        <p class="sub" style="margin-top:12px">Nhập mã PIN để tiếp tục</p>
      </div>
      <div class="card">
        <input id="pin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off">
        <div class="btns"><button class="act bi" id="pinBtn">Mở khoá</button></div>
      </div>
    </div>
  </div>

  <div id="app" style="display:none">
    <div class="hd">
      <div class="brand"><span class="mark"></span>
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
          <div class="switch"><div><div class="lbl">Tự động check-in/out</div>
            <div class="hint">Chạy trên cloud theo giờ ca</div></div>
            <div class="toggle" id="tgAuto"><div class="knob"></div></div></div>
          <div class="switch"><div><div class="lbl">Bỏ qua hôm nay</div>
            <div class="hint">Không tự động trong hôm nay</div></div>
            <div class="toggle" id="tgSkip"><div class="knob"></div></div></div>
          <div class="switch"><div><div class="lbl">Báo Slack</div>
            <div class="hint">Gửi thông báo khi check-in/out</div></div>
            <div class="toggle" id="tgSlack"><div class="knob"></div></div></div>
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
      return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; });
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
    return new Date(iso).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Ho_Chi_Minh" });
  }

  function render(data){
    $("dateline").textContent = data.date + "  ·  " + data.now;
    var box = $("shifts");
    if(!data.assignments.length){
      box.innerHTML = '<div class="card empty">Không có ca nào hôm nay 🌙</div>';
    } else {
      box.innerHTML = data.assignments.map(function(a, i){
        var canIn = a.state === "none";
        var canOut = a.state === "open";
        var cls = "card reveal" + (a.state === "open" ? " glow" : "");
        return '<div class="' + cls + '" style="animation-delay:' + (i * 70) + 'ms">'
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
      api("config", body).then(function(r){ toast(r.config[key] ? onMsg : offMsg); })
        .catch(function(e){ toast(e.message, true); load(); });
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
    var v = $("pin").value.trim(); if(!v) return; PIN = v;
    api("login").then(function(){ localStorage.setItem("shiftPin", PIN); showApp(); })
      .catch(function(){ PIN=""; toast("PIN sai", true); });
  };
  $("pin").addEventListener("keydown", function(e){ if(e.key === "Enter") $("pinBtn").click(); });

  // Pointer parallax on scene layers (transform/opacity only, rAF-smoothed, off under reduced-motion).
  (function(){
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var layers = [].slice.call(document.querySelectorAll(".layer[data-depth]"));
    if(!layers.length) return;
    var tx=0, ty=0, cx=0, cy=0, raf=0;
    function tick(){
      cx += (tx-cx)*0.07; cy += (ty-cy)*0.07;
      for(var i=0;i<layers.length;i++){
        var d = parseFloat(layers[i].getAttribute("data-depth"));
        layers[i].style.transform = "translate3d(" + (cx*d*-28).toFixed(1) + "px," + (cy*d*-20).toFixed(1) + "px,0)";
      }
      if(Math.abs(tx-cx)>0.0008 || Math.abs(ty-cy)>0.0008){ raf=requestAnimationFrame(tick); } else { raf=0; }
    }
    window.addEventListener("pointermove", function(e){
      tx = e.clientX/window.innerWidth - 0.5;
      ty = e.clientY/window.innerHeight - 0.5;
      if(!raf) raf=requestAnimationFrame(tick);
    }, {passive:true});
  })();

  if(PIN) showApp(); else showGate();
</script>
</body>
</html>`;
}
