# Shift Auto — Trạng thái & Tiếp tục công việc

Cập nhật: **2026-05-28 ~14:00 ICT**

## Đang chạy ở đâu
- **Web app + auto check-in/out** đã deploy trên **Cloudflare Worker `shift-auto`**.
- **Link:** https://shift-auto.nguyentrunghieu002.workers.dev — **PIN: (xem Cloudflare secret `UI_PIN`)**
- Mã nguồn worker: `D:\01_Projects\auto_checkin\cf-worker\`
- Script local cũ (`auto-shift.js` + `run-shift.cmd`) giữ làm **backup**. 4 task Task Scheduler đã **GỠ** (cloud thay thế).
- Account Cloudflare: Nguyentrunghieu002@gmail.com · subdomain `nguyentrunghieu002.workers.dev`.

## Kiến trúc
- 1 Worker: phục vụ UI (`/`), API (`/api/status|checkin|checkout|config|login`) chặn bằng PIN, và cron tự động.
- **KV `SHIFT_KV`** (id `9bc7acbba8a849759e729f1020d0d32a`): lưu `session` (refresh token xoay vòng) + `config` `{autoEnabled, skipDates, slackNotify}` + `slack_action_id` (id server-action Slack đã cache).
- **Secrets:** `EMAIL`, `PASSWORD`, `UI_PIN` — đặt qua `wrangler secret put`, không lưu trong repo.
- **Vars** (trong wrangler.toml, public-safe): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MEMBER_ID`.

## Thông báo Slack (mirror web app)
- Web Shift Manager thật: sau khi ghi `checkins`, nó gọi thêm 1 **Next.js Server Action `sendSlackCheckInNotification(name, role, "HH:00 - HH:00", "checkin"|"checkout")`** → bắn tin Slack. Ghi DB trực tiếp (như bot) **không** kích hoạt nó.
- Worker giờ **tự gọi lại server action đó** sau mỗi check-in/out thành công (cả cron lẫn nút trên UI), để Slack khớp với web. Code: `notifySlack()` trong `src/shift.js`.
- Cách hoạt động: dựng cookie phiên `@supabase/ssr` từ session của bot → POST `/dashboard/my-schedule` kèm header `Next-Action: <id>` + body `[name,role,slot,action]`. `<id>` **đổi mỗi lần app redeploy** nên worker **tự cào lại** id từ bundle public và cache ở KV `slack_action_id`; gửi lỗi thì tự cào lại 1 lần.
- **Không chặn chấm công:** lỗi Slack chỉ log, không làm hỏng check-in/out.
- **Công tắc:** toggle "Báo Slack" trên UI, hoặc `config.slackNotify` (mặc định bật).
- ✅ **Đã verify LIVE 28/05:** auto check-in 13:55 ca chiều (14–17) ghi DB **và** bắn Slack thành công trên cron thật (đường refresh-token). Tin Slack đúng dạng *"Member: Hew has checked in / Role: TS / Shift: 14:00 - 17:00"*.
- ⚠️ **Bug đã fix (28/05, commit `93a0df3`):** Slack **không gửi** dù check-in/out DB vẫn OK. Nguyên nhân thật: `notifySlack` dựng cookie từ biến closure `session`, nhưng `tryRefresh()` lại khai báo `let session` cục bộ → `session = data` gán nhầm vào biến cục bộ, để closure `session` = null. Đường thường (refresh token còn tốt) không chạy `passwordLogin` (nơi gán đúng) → cookie null → `no-session` → không gửi. Sửa: đổi biến cục bộ thành `stored`. Đã verify trong worker: `hasSession:true`, cookie xác thực (page 200).
- Action id hiện tại đã cache ở KV remote: `78acd24ea3ce998c554a3b7631e24299375f731bd1`. (Pre-cache id giúp cron khỏi phải cào ~18 file JS mỗi lần — vẫn nên giữ.)
- ⚠️ **Khi chủ app redeploy:** id đổi → tin Slack lỗi 1 lần, self-heal tự cào lại id mới. Nếu Slack im sau khi app upstream đổi: cào lại id thủ công và `wrangler kv key put --remote --namespace-id 9bc7acbba8a849759e729f1020d0d32a slack_action_id <id-mới>`.

## Lịch auto (cron UTC, ICT = +7), Thứ 2–Thứ 6
| ICT | UTC cron | Hành động |
|---|---|---|
| 07:55 | `55 0 * * 1-5` | check-in ca sáng (slot 8-11) |
| 11:01 | `1 4 * * 1-5` | check-out ca sáng |
| 13:55 | `55 6 * * 1-5` | check-in ca chiều (slot 14-17) |
| 17:01 | `1 10 * * 1-5` | check-out ca chiều |
- Offset: check-in = giờ-bắt-đầu **−5'**, check-out = giờ-kết-thúc **+1'** (hằng số `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` trong `src/index.js`, **phải khớp** cron trong `wrangler.toml`).
- Logic: check-in nếu `now ∈ [start−5, end)` và chưa check-in; check-out nếu `now ≥ end+1` và đang mở. Idempotent + tự khớp đúng ca theo giờ.

## Bug đã fix hôm nay
- Bảng `checkins` **không có cột `role`** → payload check-in cũ gửi `role` gây lỗi `400 PGRST204`. Đã bỏ field `role` (cả worker lẫn script local). Redeploy ~08:00.
- Cron 07:55 sáng nay **fail vì bug này** (trước khi fix). Mình đã tự check-in ca 8-11 bằng **app gốc** lúc 07:58 → ca sáng vẫn được tính.
- Cột thật của `checkins`: `id, assignment_id, member_id, checkin_time, checkin_text, checkout_time, checkout_text, created_at`.

## ✅ CẦN KIỂM TRA KHI QUAY LẠI (lần đầu chạy auto thật)
- [ ] **11:01** — auto check-out ca 8-11 có chạy? (check-out chưa từng lỗi → kỳ vọng OK)
- [ ] **13:55** — auto check-in ca 14-17 có chạy? ← **QUAN TRỌNG NHẤT**, lần đầu test path check-in đã fix
- [ ] **17:01** — auto check-out ca 14-17
- Cách xem: mở app, hoặc xem log: Cloudflare dashboard → Workers & Pages → `shift-auto` → **Observability**; hoặc live: `cd cf-worker && npx wrangler tail`.
- ⚠️ **ĐỪNG bấm "Check in" cho 14-17 thủ công trước 13:55** — sẽ tạo record sai giờ và làm auto bỏ qua.

## Lệnh hay dùng (chạy trong `cf-worker/`)
- Deploy lại sau khi sửa code: `npx wrangler deploy`
- Đổi mật khẩu Shift Manager (khi bạn đổi pass thật): `printf '%s' "PASS_MỚI" | npx wrangler secret put PASSWORD`
- Đổi PIN: `printf '%s' "PIN_MỚI" | npx wrangler secret put UI_PIN`
- Nếu deploy lỗi `EBUSY`: kill tiến trình kẹt `Get-Process workerd | Stop-Process -Force` rồi deploy lại.

## Rủi ro / việc có thể làm tiếp
- Cron cố định khớp ca **8-11 / 14-17**. Hôm nào ca lệch giờ khác → cron không khớp, cần chỉnh.
- Chỉ 4 fire/ngày, **không dự phòng** nếu Cloudflare lỡ 1 fire (hiếm). Có thể thêm fire lặp quanh mỗi mốc nếu muốn chắc.
- Link public chặn bằng **PIN 4 số** — đủ cá nhân nhưng về lý thuyết dò được; có thể thêm rate-limit.
- **Mật khẩu Shift Manager** đang nằm trong Cloudflare Secret (mã hoá) — nên đổi mạnh hơn rồi cập nhật secret.
- Khi refresh token chết, worker tự login lại bằng EMAIL/PASSWORD (đã có fallback).
