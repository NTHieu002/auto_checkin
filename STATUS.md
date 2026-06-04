# Shift Auto — Trạng thái & Tiếp tục công việc

Cập nhật: **2026-06-04 ~08:30 ICT**

## 04/06 — Feature: thống kê giờ OT + lương trong app (pixel art)
- Block **OT riêng**, thiết kế **pixel-art kiểu Nhật** (thác nước động, núi Phú Sĩ, cây thông/sakura, đồng cỏ; font "Press Start 2P" cho số). Đọc `ot_requests` qua `getOtStats()` (`shift.js`), trả trong `/api/status`.
- **Filter** 2 tab: **Tháng này** (mặc định) / **Tất cả (all-time)**. Mỗi tab hiện 3 số: **giờ thực**, **giờ ×hệ số**, **thực nhận (tiền)**.
- **Hệ số lương:** cuối tuần (T7/CN theo `shift_date`) **×2**, ngày thường **×1.5**. **Tiền = giờ-×hệ-số × 80.000đ/h** (`OT_RATE`).
- Số hiện tại: Tháng này **15h thực → 22.5h hệ số → 1.800.000đ**; All-time **36h → 60h → 4.800.000đ**. Mirror read-only của tab "OT request" app gốc.

## 04/06 — Feature: auto-checkout khi COVER ca người khác
- **Vấn đề:** ca bạn *cover* (làm thay) thuộc `member_id` người khác → không nằm trong `getTodayAssignments` (lọc theo bạn) → cron cũ **không bao giờ tự checkout** ca cover.
- **Giải pháp (đã deploy, version `4afe7aa8`):** thêm **cover sweep** cuối `runAuto`. Nó quét `getOpenCheckins()` = check-in **đang mở mang `member_id` của bạn** (kèm assignment embed), với cái nào chủ ca ≠ bạn và `now ≥ end+CHECKOUT_LAG_MIN` thì `checkoutById()`. **Không auto check-IN cover** (không phát hiện được trước khi có check-in) và **không bắn Slack** (sẽ post nhầm tên chủ ca). `/cron` trả thêm field `covers[]`. Code: `src/shift.js` (`getOpenCheckins`, `checkoutById`) + `src/index.js` (sweep).
- ✅ **Verified LIVE 04/06:** ca 5-8 cover (Max nghỉ, Hew nhận) tự checkout lúc **08:05:07 ICT** nhờ cron-job.org fire — không can thiệp tay, không Slack.
- 🔼 **Nâng cấp 04/06 (version `8cc26da6`): auto-checkout MỌI ca cover, không giới hạn khung giờ.** Trước chỉ chạy 07:00–19:00. Giờ: (a) `getOpenCheckins` lấy cả ca **hôm qua** (bắt ca đêm vắt nửa đêm); (b) tính giờ due trên **datetime đầy đủ** (`shift_date` + giờ kết, +1 ngày nếu slot wrap như `23-2`); (c) Cloudflare cron đổi `*/5 0-11 * * 1-5` → **`*/5 * * * *` (24/7, mọi ngày)**. Nhờ vậy ca 2-5 (kết 05:00) và 23-2 (kết 02:00 hôm sau) đều tự checkout.
- ⚠️ **CẦN LÀM THỦ CÔNG:** sửa job trên **cron-job.org → chạy 24/7** (mỗi 5', mọi giờ, mọi ngày). Cloudflare cron 24/7 chỉ là backup không đáng tin; muốn ca ngoài khung checkout **đúng giờ** thì cron-job.org phải fire 24/7. Nếu không, ca đêm vẫn được checkout nhưng **trễ** (tới lần fire kế tiếp).
- **Cover ĐÚNG quy trình = GHI 3 BẢNG** (reverse-engineer 04/06): "nhận ca" trên web tạo đồng thời (1) PATCH `leaves` → `covered_by=<bạn>, status='covered', covered_at`; (2) POST **`ot_requests`** `{member_id:bạn, leave_id, assignment_id, status:'approved', approved_by:bạn}` — **đây là cái tab "OT request" trên `/dashboard/leave` đọc**; (3) POST `checkins` dưới `member_id` của bạn. Thiếu bản ghi nào → app không hiện đúng. Ca 2-5 hôm nay từng chỉ có check-in (mồ côi); đã vá đủ cả 3 → hiện như ca 5-8. Schema đầy đủ (`members/shift_assignments/checkins/leaves/ot_requests`) + handshake xem **CLAUDE.md › "Leave / cover / OT data model"**.
- **Giới hạn quyền (RLS, tài khoản thường):** KHÔNG xoá được `checkins` (no delete policy, DELETE trả 0 dòng); KHÔNG đổi chủ ca người khác (`shift_assignments` PATCH trả 200 nhưng 0 dòng). Đổi/xoá kiểu đó cần admin/`service_role`. `/dashboard/leave` render server (RSC) — data không nằm trong HTML/JS bundle.
- **Lưu ý deploy:** user có 2 account Cloudflare — worker ở **`Nguyentrunghieu002@gmail.com`** (account id `471fa1e3959cd2cba57f77422aacad68`), KHÔNG phải `nthieu.personal`. Khi dùng API token phải kèm `CLOUDFLARE_ACCOUNT_ID=471fa1e…` (wrangler hay cache nhầm account).

## 2026-05-29 ~17:45 ICT (trước đó)

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

## 29/05 — sửa thứ tự card + sự cố ghi nhầm ca
- **Thứ tự card sai:** `getTodayAssignments` cũ dùng `order=shift_slot.asc` của Supabase = sort **chuỗi** → `"14-17"` đứng TRÊN `"8-11"`. Đã bỏ order DB, sort **theo giờ bắt đầu thật** (`parseSlot(slot).start`) trong `src/shift.js`. Sửa này khắc phục cả thứ tự hiển thị card LẪN fallback `assignments[0]` (giờ trỏ đúng ca sớm nhất). Đã deploy.
- **Sự cố do thứ tự sai:** sáng 29/05 card 14-17 hiển thị trên cùng → đã bấm check-in/out nhầm vào ca **14-17** (07:59–11:09) thay vì ca sáng 8-11. Hậu quả: 8-11 trống, 14-17 thành `closed` → cron 13:55 sẽ **bỏ qua check-in chiều** (idempotent) → **mất notice chiều**.
- **Khắc phục dữ liệu:** PATCH `assignment_id` của dòng check-in đó từ 14-17 → 8-11 (qua REST, **không** bắn Slack). Kết quả: 8-11 hiện đúng giờ sáng; 14-17 trống lại để 13:55 cron tự check-in + bắn notice.
- **Slack hạ tầng vẫn khỏe:** action id `78acd24...` vẫn khớp bundle hiện tại (app gốc chưa redeploy), cookie auth vẫn sống (page 200). "Không thấy notice" hôm nay là do sự cố ghi nhầm ca, không phải Slack hỏng.
- ⚠️ **Log lịch sử worker không query được qua API** (token wrangler chỉ có `workers_tail:read`; `tail` chỉ xem trực tiếp). Dựng lại diễn biến bằng Supabase REST + KV `session.expires_at` (= lần auth/cron gần nhất + 1h).

## ⚠️ 29/05 (chiều) — Cloudflare cron KHÔNG fire → chuyển sang trigger ngoài
- **Triệu chứng:** suốt 29/05 **không cron nào chạy** (check-in sáng + chiều đều do bạn làm tay; auto check-out 17:01 không nổ). Tail sống **~40 phút** trùm mốc 17:01 (cả cron cũ lẫn cron mới `*/5`, lẽ ra nổ ≥3 lần) → **0 sự kiện `scheduled`**.
- **Đã loại trừ:** cron vẫn đăng ký đủ (xác minh qua API), worker khỏe (fetch/UI chạy), code đúng (lỗi code thì tail vẫn hiện "scheduled - Error"). → Nguyên nhân: **Cloudflare free-tier cron là best-effort, hôm nay không giao trigger** cho worker này. Tăng tần suất vô ích vì Cloudflare không gọi.
- **Giải pháp (không phụ thuộc cron Cloudflare):** thêm endpoint **`GET /cron?key=<CRON_KEY>`** (hoặc header `x-cron-key`) chạy `runAuto` và **trả về JSON tóm tắt hành động** (bù cho việc không xem được log Cloudflare). Một scheduler **ngoài** (**cron-job.org**) gọi vào mỗi 5' → fetch của worker vẫn chạy tốt nên auto chạy ổn định.
- **Secret `CRON_KEY`** đã set (giá trị lưu local ở `cf-worker/.cron-key.txt`, đã `.gitignore`). Đổi: `printf '%s' "KEY_MỚI" | npx wrangler secret put CRON_KEY`.
- Cron Cloudflare `*/5 0-11 * * 1-5` **vẫn giữ** làm dự phòng (idempotent — nếu Cloudflare hồi thì chỉ thêm redundancy).

## Lịch auto, Thứ 2–Thứ 6
- **Trigger chính:** cron-job.org GET `…/cron?key=…` **mỗi 5'**, khung **07:00–19:00 ICT, T2–T6** (set timezone Asia/Ho_Chi_Minh trong cron-job.org).
- **Trigger dự phòng:** Cloudflare cron `*/5 0-11 * * 1-5` (UTC) = mỗi 5' trong 07:00–18:55 ICT.
- Offset: check-in = giờ-bắt-đầu **−5'**, check-out = giờ-kết-thúc **+1'** (hằng số `CHECKIN_LEAD_MIN`/`CHECKOUT_LAG_MIN` trong `src/index.js`). Với trigger lặp mỗi 5', **các hằng số này** (không phải cadence cron) định nghĩa đúng thời điểm hành động.
- Logic: check-in nếu `now ∈ [start−5, end)` và chưa check-in; check-out nếu `now ≥ end+1` và đang mở. Idempotent — fire thừa/trễ vô hại, miễn 1 fire trong cửa sổ trúng.

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
- Đổi key trigger ngoài: `printf '%s' "KEY_MỚI" | npx wrangler secret put CRON_KEY` (rồi cập nhật lại job trên cron-job.org)
- Tự gọi auto thủ công (debug, KHÔNG phụ thuộc cron): `curl "https://shift-auto.nguyentrunghieu002.workers.dev/cron?key=<CRON_KEY>"` → trả JSON `{date, now, actions:[...]}`.
- Nếu deploy lỗi `EBUSY`: kill tiến trình kẹt `Get-Process workerd | Stop-Process -Force` rồi deploy lại.

## Rủi ro / việc có thể làm tiếp
- `runAuto` đọc ca thật và parse slot của từng assignment → tự khớp mọi giờ ca **trong khung 07:00–19:00 ICT**. Nếu ca lệch ra ngoài khung này (vd ca tối/đêm) → mở rộng khung giờ cron-job.org + dải giờ cron Cloudflare (`0-11`).
- **Độ tin cậy auto giờ dựa vào cron-job.org** (ngoài), không phải cron Cloudflare (đã chứng minh không đáng tin). Nếu auto im: kiểm tra job trên cron-job.org còn bật + lịch chạy gần nhất; test tay bằng `curl …/cron?key=…`.
- Link public chặn bằng **PIN 4 số** — đủ cá nhân nhưng về lý thuyết dò được; có thể thêm rate-limit.
- **Mật khẩu Shift Manager** đang nằm trong Cloudflare Secret (mã hoá) — nên đổi mạnh hơn rồi cập nhật secret.
- Khi refresh token chết, worker tự login lại bằng EMAIL/PASSWORD (đã có fallback).
